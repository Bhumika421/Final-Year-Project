<?php
declare(strict_types=1);

require_once __DIR__ . '/payment_provider_interface.php';

class PayPalProvider implements PaymentProviderInterface {
  private string $baseUrl;
  private string $clientId;
  private string $clientSecret;

  public function __construct(array $config) {
    $mode = (string)($config['mode'] ?? 'sandbox');
    $this->baseUrl = $mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    $this->clientId = (string)($config['client_id'] ?? '');
    $this->clientSecret = (string)($config['client_secret'] ?? '');
  }

  public function initiate(array $payload): array {
    $token = $this->accessToken();
    $requestBody = [
      'intent' => 'CAPTURE',
      'purchase_units' => [[
        'reference_id' => (string)$payload['booking_code'],
        'description' => (string)$payload['description'],
        'amount' => [
          'currency_code' => 'USD',
          'value' => number_format((float)$payload['amount_usd'], 2, '.', ''),
        ],
      ]],
      'application_context' => [
        'return_url' => (string)$payload['return_url'],
        'cancel_url' => (string)$payload['cancel_url'],
        'user_action' => 'PAY_NOW',
      ],
    ];

    $res = $this->request('POST', '/v2/checkout/orders', $token, $requestBody);
    $json = $res['json'];
    if ((int)($res['status'] ?? 0) >= 400 || empty($json['id'])) {
      return [
        'ok' => false,
        'error' => $json['message'] ?? 'Unable to create PayPal order',
        'raw' => $json,
      ];
    }

    $approvalUrl = '';
    $links = $json['links'] ?? [];
    foreach ($links as $link) {
      $rel = (string)($link['rel'] ?? '');
      if ($rel === 'approve' || $rel === 'payer-action') {
        $approvalUrl = (string)($link['href'] ?? '');
        break;
      }
    }

    if ($approvalUrl === '') {
      // Fallback: some responses may omit expected rel labels but include checkout URL.
      foreach ($links as $link) {
        $href = (string)($link['href'] ?? '');
        if ($href !== '' && strpos($href, '/checkoutnow?token=') !== false) {
          $approvalUrl = $href;
          break;
        }
      }
    }

    if ($approvalUrl === '') {
      return [
        'ok' => false,
        'error' => 'PayPal approval URL missing in create-order response',
        'raw' => $json,
      ];
    }

    return [
      'ok' => true,
      'order_id' => (string)$json['id'],
      'approval_url' => $approvalUrl,
      'raw' => $json,
    ];
  }

  public function capture(array $payload): array {
    $orderId = (string)($payload['order_id'] ?? '');
    if ($orderId === '') {
      return ['ok' => false, 'error' => 'Missing order id'];
    }

    $token = $this->accessToken();
    $res = $this->request('POST', '/v2/checkout/orders/' . rawurlencode($orderId) . '/capture', $token, (object)[]);
    $json = $res['json'];
    if ((int)($res['status'] ?? 0) >= 400) {
      return [
        'ok' => false,
        'error' => $json['message'] ?? 'Unable to capture PayPal order',
        'raw' => $json,
      ];
    }

    $status = (string)($json['status'] ?? '');
    $captureId = '';
    $amount = 0.0;

    $captures = $json['purchase_units'][0]['payments']['captures'] ?? [];
    if ($captures && is_array($captures)) {
      $cap = $captures[0];
      $captureId = (string)($cap['id'] ?? '');
      $amount = (float)($cap['amount']['value'] ?? 0);
      if ($status === '' && isset($cap['status'])) {
        $status = (string)$cap['status'];
      }
    }

    $ok = in_array($status, ['COMPLETED', 'APPROVED'], true);

    return [
      'ok' => $ok,
      'status' => $status,
      'order_id' => $orderId,
      'capture_id' => $captureId,
      'amount_usd' => $amount,
      'raw' => $json,
      'error' => $ok ? null : ('PayPal capture status: ' . ($status ?: 'UNKNOWN')),
    ];
  }

  private function accessToken(): string {
    if ($this->clientId === '' || $this->clientSecret === '') {
      throw new RuntimeException('PayPal credentials are not configured');
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $this->baseUrl . '/v1/oauth2/token',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
      CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Accept-Language: en_US',
        'Authorization: Basic ' . base64_encode($this->clientId . ':' . $this->clientSecret),
        'Content-Type: application/x-www-form-urlencoded',
      ],
    ]);

    $raw = curl_exec($ch);
    if ($raw === false) {
      $err = curl_error($ch);
      throw new RuntimeException('PayPal token request failed: ' . $err);
    }
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);

    $json = json_decode($raw, true);
    if ($status >= 400 || !is_array($json) || empty($json['access_token'])) {
      throw new RuntimeException('PayPal token request rejected');
    }

    return (string)$json['access_token'];
  }

  private function request(string $method, string $path, string $token, $payload): array {
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $this->baseUrl . $path,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => $method,
      CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
      CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json',
      ],
    ]);

    $raw = curl_exec($ch);
    if ($raw === false) {
      $err = curl_error($ch);
      throw new RuntimeException('PayPal request failed: ' . $err);
    }

    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);

    $json = json_decode($raw, true);
    if (!is_array($json)) $json = ['raw' => $raw];

    return ['status' => $status, 'json' => $json];
  }
}
