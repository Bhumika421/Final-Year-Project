<?php
declare(strict_types=1);

require_once __DIR__ . '/payment_provider_interface.php';

class KhaltiProvider implements PaymentProviderInterface {
  private string $secretKey;
  private string $initiateUrl;
  private string $lookupUrl;
  private float $nprRate;
  private string $websiteUrl;

  public function __construct(array $config) {
    $this->secretKey = trim((string)($config['secret_key'] ?? ''));
    $this->initiateUrl = trim((string)($config['initiate_url'] ?? 'https://a.khalti.com/api/v2/epayment/initiate/'));
    $this->lookupUrl = trim((string)($config['lookup_url'] ?? 'https://dev.khalti.com/api/v2/epayment/lookup/'));
    $this->nprRate = (float)($config['npr_rate'] ?? 133.0);
    $this->websiteUrl = rtrim((string)($config['website_url'] ?? ''), '/');
  }

  public function initiate(array $payload): array {
    if ($this->secretKey === '' || $this->isPlaceholderSecret($this->secretKey)) {
      return ['ok' => false, 'error' => 'Khalti credentials are not configured'];
    }

    $amountUsd = (float)($payload['amount_usd'] ?? 0);
    if ($amountUsd <= 0) {
      return ['ok' => false, 'error' => 'Invalid payment amount'];
    }

    $returnUrl = trim((string)($payload['return_url'] ?? ''));
    if ($returnUrl === '') {
      return ['ok' => false, 'error' => 'Missing return_url'];
    }

    $purchaseOrderId = trim((string)($payload['purchase_order_id'] ?? ''));
    if ($purchaseOrderId === '') {
      return ['ok' => false, 'error' => 'Missing purchase_order_id'];
    }

    $purchaseOrderName = trim((string)($payload['purchase_order_name'] ?? 'Tour booking payment'));

    $amountNpr = round($amountUsd * $this->nprRate, 2);
    $amountPaisa = (int)round($amountNpr * 100);
    if ($amountPaisa < 100) {
      return ['ok' => false, 'error' => 'Khalti amount must be at least NPR 1'];
    }

    $websiteUrl = trim((string)($payload['website_url'] ?? $this->websiteUrl));
    if ($websiteUrl === '') {
      $parts = parse_url($returnUrl);
      $websiteUrl = (($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? 'localhost'));
      if (isset($parts['port'])) {
        $websiteUrl .= ':' . $parts['port'];
      }
    }

    $requestPayload = [
      'return_url' => $returnUrl,
      'website_url' => $websiteUrl,
      'amount' => $amountPaisa,
      'purchase_order_id' => $purchaseOrderId,
      'purchase_order_name' => $purchaseOrderName,
    ];

    $res = $this->request($this->initiateUrl, $requestPayload);
    if (!($res['ok'] ?? false)) {
      return [
        'ok' => false,
        'error' => $res['error'] ?? 'Khalti initiate request failed',
        'details' => $res['details'] ?? null,
      ];
    }

    $json = $res['json'];
    $paymentUrl = trim((string)($json['payment_url'] ?? ''));
    $pidx = trim((string)($json['pidx'] ?? ''));
    if ($paymentUrl === '' || $pidx === '') {
      return ['ok' => false, 'error' => 'Khalti initiate response missing payment URL'];
    }

    return [
      'ok' => true,
      'payment_url' => $paymentUrl,
      'pidx' => $pidx,
      'amount_paisa' => $amountPaisa,
      'amount_npr' => $amountNpr,
      'raw' => $json,
    ];
  }

  public function capture(array $payload): array {
    if ($this->secretKey === '' || $this->isPlaceholderSecret($this->secretKey)) {
      return ['ok' => false, 'error' => 'Khalti credentials are not configured'];
    }

    $pidx = trim((string)($payload['pidx'] ?? ''));
    if ($pidx === '') {
      return ['ok' => false, 'error' => 'Missing pidx'];
    }

    $res = $this->request($this->lookupUrl, ['pidx' => $pidx]);
    if (!($res['ok'] ?? false)) {
      return [
        'ok' => false,
        'error' => $res['error'] ?? 'Khalti lookup request failed',
        'details' => $res['details'] ?? null,
      ];
    }

    $json = $res['json'];
    $status = trim((string)($json['status'] ?? ''));
    if (strcasecmp($status, 'Completed') !== 0) {
      return ['ok' => false, 'error' => 'Khalti payment is not completed'];
    }

    $lookupPidx = trim((string)($json['pidx'] ?? ''));
    if ($lookupPidx === '' || $lookupPidx !== $pidx) {
      return ['ok' => false, 'error' => 'Khalti lookup mismatch'];
    }

    $purchaseOrderId = trim((string)($json['purchase_order_id'] ?? ''));
    $expectedPurchaseOrderId = trim((string)($payload['expected_purchase_order_id'] ?? ''));
    // Some Khalti lookup responses do not include purchase_order_id.
    // Enforce equality only when the gateway returns the field.
    if ($expectedPurchaseOrderId !== '' && $purchaseOrderId !== '' && $purchaseOrderId !== $expectedPurchaseOrderId) {
      return ['ok' => false, 'error' => 'Khalti purchase order mismatch'];
    }

    $amountPaisa = (int)($json['total_amount'] ?? $json['amount'] ?? 0);

    return [
      'ok' => true,
      'status' => $status,
      'pidx' => $lookupPidx,
      'transaction_id' => trim((string)($json['transaction_id'] ?? '')),
      'purchase_order_id' => $purchaseOrderId,
      'amount_paisa' => $amountPaisa,
      'raw' => $json,
    ];
  }

  private function request(string $url, array $payload): array {
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 20,
      CURLOPT_CONNECTTIMEOUT => 10,
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
      CURLOPT_HTTPHEADER => [
        'Authorization: Key ' . $this->secretKey,
        'Accept: application/json',
        'Content-Type: application/json',
      ],
    ]);

    $raw = curl_exec($ch);
    if ($raw === false) {
      $error = curl_error($ch);
      curl_close($ch);
      return ['ok' => false, 'error' => 'Khalti request failed: ' . $error];
    }

    $statusCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $json = json_decode($raw, true);
    if (!is_array($json)) {
      return ['ok' => false, 'error' => 'Invalid response from Khalti', 'details' => ['raw' => $raw, 'http_status' => $statusCode]];
    }

    if ($statusCode >= 400) {
      $details = [
        'http_status' => $statusCode,
        'khalti' => $json,
      ];
      return [
        'ok' => false,
        'error' => 'Khalti API rejected request',
        'details' => $details,
      ];
    }

    return ['ok' => true, 'json' => $json];
  }

  private function isPlaceholderSecret(string $secretKey): bool {
    $normalized = strtoupper($secretKey);
    return $normalized === 'KHALTI_TEST_SECRET_KEY'
      || $normalized === 'KHALTI_SECRET_KEY'
      || str_starts_with($normalized, 'YOUR_');
  }
}
