<?php
declare(strict_types=1);

require_once __DIR__ . '/payment_provider_interface.php';

class ESewaProvider implements PaymentProviderInterface {
  private string $merchantCode;
  private string $secretKey;
  private string $formUrl;
  private string $verifyUrl;
  private float $nprRate;

  public function __construct(array $config) {
    $this->merchantCode = trim((string)($config['merchant_code'] ?? ''));
    $this->secretKey = trim((string)($config['secret_key'] ?? ''));
    $this->formUrl = rtrim((string)($config['form_url'] ?? 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'), '/');
    $this->verifyUrl = rtrim((string)($config['verify_url'] ?? 'https://rc-epay.esewa.com.np/api/epay/transaction/status/'), '/');
    $this->nprRate = (float)($config['npr_rate'] ?? 133.0);

    if (!$this->isEnvironmentConfigConsistent()) {
      throw new InvalidArgumentException('eSewa form_url and verify_url environments do not match');
    }
  }

  public function initiate(array $payload): array {
    if ($this->merchantCode === '' || $this->secretKey === '') {
      return ['ok' => false, 'error' => 'eSewa credentials are not configured'];
    }

    $amountUsd = (float)($payload['amount_usd'] ?? 0);
    if ($amountUsd <= 0) {
      return ['ok' => false, 'error' => 'Invalid payment amount'];
    }

    $amountNpr = round($amountUsd * $this->nprRate, 2);
    $amountString = number_format($amountNpr, 2, '.', '');
    $transactionUuid = (string)($payload['transaction_uuid'] ?? '');
    if ($transactionUuid === '') {
      $bookingCode = trim((string)($payload['booking_code'] ?? 'BOOKING'));
      $transactionUuid = $bookingCode . '-' . time() . '-' . bin2hex(random_bytes(4));
    }

    if (!preg_match('/^[A-Za-z0-9-]+$/', $transactionUuid)) {
      return ['ok' => false, 'error' => 'Invalid transaction UUID format for eSewa'];
    }
    if (strlen($transactionUuid) > 40) {
      return ['ok' => false, 'error' => 'Transaction UUID is too long for eSewa'];
    }

    $successUrl = trim((string)($payload['success_url'] ?? ''));
    $failureUrl = trim((string)($payload['failure_url'] ?? ''));
    if ($successUrl === '' || $failureUrl === '') {
      return ['ok' => false, 'error' => 'Missing success/failure URLs'];
    }

    $signatureMessage = 'total_amount=' . $amountString
      . ',transaction_uuid=' . $transactionUuid
      . ',product_code=' . $this->merchantCode;
    $signature = base64_encode(hash_hmac('sha256', $signatureMessage, $this->secretKey, true));

    $fields = [
      'amount' => $amountString,
      'tax_amount' => '0',
      'total_amount' => $amountString,
      'transaction_uuid' => $transactionUuid,
      'product_code' => $this->merchantCode,
      'product_service_charge' => '0',
      'product_delivery_charge' => '0',
      'success_url' => $successUrl,
      'failure_url' => $failureUrl,
      'signed_field_names' => 'total_amount,transaction_uuid,product_code',
      'signature' => $signature,
    ];

    return [
      'ok' => true,
      'action_url' => $this->formUrl,
      'fields' => $fields,
      'transaction_uuid' => $transactionUuid,
      'amount_npr' => $amountNpr,
    ];
  }

  public function capture(array $payload): array {
    if ($this->merchantCode === '' || $this->secretKey === '') {
      return ['ok' => false, 'error' => 'eSewa credentials are not configured'];
    }

    $esewaData = [];
    $rawData = trim((string)($payload['data'] ?? ''));
    if ($rawData !== '') {
      $decoded = $this->decodeEsewaData($rawData);
      if (!$decoded['ok']) {
        return ['ok' => false, 'error' => $decoded['error']];
      }
      $esewaData = $decoded['data'];

      $sigValidation = $this->validateCallbackSignature($esewaData);
      if (!($sigValidation['ok'] ?? false)) {
        return ['ok' => false, 'error' => $sigValidation['error'] ?? 'Invalid callback signature'];
      }

      $callbackStatus = strtoupper(trim((string)($esewaData['status'] ?? '')));
      if ($callbackStatus !== 'COMPLETE' && $callbackStatus !== 'SUCCESS') {
        return ['ok' => false, 'error' => 'Payment is not completed'];
      }
    }

    $status = strtoupper(trim((string)($esewaData['status'] ?? ($payload['status'] ?? ''))));
    if ($status !== '' && $status !== 'COMPLETE' && $status !== 'SUCCESS') {
      return ['ok' => false, 'error' => 'Payment is not completed'];
    }

    $transactionUuid = trim((string)($esewaData['transaction_uuid'] ?? ($payload['transaction_uuid'] ?? ($payload['oid'] ?? ''))));
    $totalAmountRaw = (string)($esewaData['total_amount'] ?? ($payload['total_amount'] ?? ($payload['amt'] ?? '')));
    $totalAmount = $this->normalizeAmountString($totalAmountRaw);
    if ($transactionUuid === '' || $totalAmount === '') {
      return ['ok' => false, 'error' => 'Missing transaction details in callback'];
    }

    $verifyUrl = $this->verifyUrl
      . '?product_code=' . rawurlencode($this->merchantCode)
      . '&total_amount=' . rawurlencode($totalAmount)
      . '&transaction_uuid=' . rawurlencode($transactionUuid);

    $verifyRes = $this->request($verifyUrl);
    if (!($verifyRes['ok'] ?? false)) {
      return [
        'ok' => false,
        'error' => $verifyRes['error'] ?? 'eSewa verification failed',
        'details' => [
          'verify_url' => $verifyUrl,
          'http_status' => (int)($verifyRes['http_status'] ?? 0),
          'raw' => (string)($verifyRes['raw'] ?? ''),
          'transaction_uuid' => $transactionUuid,
          'total_amount' => $totalAmount,
        ],
      ];
    }

    $json = $verifyRes['json'];
    $verifyStatus = strtoupper((string)($json['status'] ?? ''));
    $verifyTxn = trim((string)($json['transaction_uuid'] ?? ''));
    if ($verifyStatus !== 'COMPLETE' || $verifyTxn === '' || $verifyTxn !== $transactionUuid) {
      return ['ok' => false, 'error' => 'Payment verification mismatch'];
    }

    $verifyAmountRaw = (string)($json['total_amount'] ?? '0');
    $callbackAmountRaw = trim((string)$totalAmount);
    if ($callbackAmountRaw !== '' && (float)$callbackAmountRaw > 0 && abs((float)$callbackAmountRaw - (float)$verifyAmountRaw) > 0.01) {
      return ['ok' => false, 'error' => 'Payment amount verification mismatch'];
    }

    $verifiedAmount = (float)($json['total_amount'] ?? 0);

    return [
      'ok' => true,
      'status' => $verifyStatus,
      'transaction_uuid' => $verifyTxn,
      'ref_id' => trim((string)($json['ref_id'] ?? ($esewaData['ref_id'] ?? ($payload['ref_id'] ?? ($payload['refId'] ?? ''))))),
      'total_amount' => $verifiedAmount,
      'raw' => [
        'callback' => $esewaData,
        'verification' => $json,
      ],
    ];
  }

  private function decodeEsewaData(string $encodedData): array {
    $encodedData = trim($encodedData);
    if ($encodedData === '') {
      return ['ok' => false, 'error' => 'Missing eSewa callback data'];
    }

    $decodedRaw = base64_decode(strtr($encodedData, ' ', '+'), true);
    if ($decodedRaw === false) {
      return ['ok' => false, 'error' => 'Invalid eSewa payload encoding'];
    }

    $json = json_decode($decodedRaw, true);
    if (!is_array($json)) {
      return ['ok' => false, 'error' => 'Invalid eSewa payload'];
    }

    return ['ok' => true, 'data' => $json];
  }

  private function isEnvironmentConfigConsistent(): bool {
    $formHost = (string)(parse_url($this->formUrl, PHP_URL_HOST) ?? '');
    $verifyHost = (string)(parse_url($this->verifyUrl, PHP_URL_HOST) ?? '');
    if ($formHost === '' || $verifyHost === '') {
      return false;
    }

    $isFormSandbox = strpos($formHost, 'rc-epay') !== false;
    $isVerifySandbox = strpos($verifyHost, 'rc-epay') !== false;

    return $isFormSandbox === $isVerifySandbox;
  }

  private function validateCallbackSignature(array $payload): array {
    $signature = trim((string)($payload['signature'] ?? ''));
    $signedFieldsRaw = trim((string)($payload['signed_field_names'] ?? ''));
    if ($signature === '' && $signedFieldsRaw === '') {
      return ['ok' => true];
    }

    if ($signature === '' || $signedFieldsRaw === '') {
      return ['ok' => false, 'error' => 'Incomplete signature fields in callback'];
    }

    $fieldNames = array_filter(array_map('trim', explode(',', $signedFieldsRaw)), static fn($v): bool => $v !== '');
    if (!$fieldNames) {
      return ['ok' => false, 'error' => 'Invalid signed field names in callback'];
    }

    $parts = [];
    foreach ($fieldNames as $fieldName) {
      if (!array_key_exists($fieldName, $payload)) {
        return ['ok' => false, 'error' => 'Signed field missing in callback payload'];
      }
      $parts[] = $fieldName . '=' . (string)$payload[$fieldName];
    }

    $expectedSignature = base64_encode(hash_hmac('sha256', implode(',', $parts), $this->secretKey, true));
    if (!hash_equals($expectedSignature, $signature)) {
      return ['ok' => false, 'error' => 'Callback signature mismatch'];
    }

    return ['ok' => true];
  }

  private function request(string $url): array {
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 15,
      CURLOPT_CONNECTTIMEOUT => 10,
      CURLOPT_HTTPHEADER => [
        'Accept: application/json',
      ],
    ]);

    $raw = curl_exec($ch);
    if ($raw === false) {
      $error = curl_error($ch);
      curl_close($ch);
      return ['ok' => false, 'error' => 'eSewa verify request failed: ' . $error];
    }

    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $json = json_decode($raw, true);
    if (!is_array($json)) {
      return ['ok' => false, 'error' => 'Invalid verify response from eSewa'];
    }

    if ($status >= 400) {
      $message = 'eSewa verify API rejected request';
      $errorText = trim((string)($json['error_message'] ?? ($json['error'] ?? ($json['message'] ?? ''))));
      if ($errorText !== '') {
        $message .= ': ' . $errorText;
      }
      return [
        'ok' => false,
        'error' => $message,
        'http_status' => $status,
        'raw' => $raw,
      ];
    }

    return ['ok' => true, 'json' => $json];
  }

  private function normalizeAmountString(string $value): string {
    $clean = trim(str_replace(',', '', $value));
    if ($clean === '') {
      return '';
    }

    if (!is_numeric($clean)) {
      return $clean;
    }

    return number_format((float)$clean, 2, '.', '');
  }
}