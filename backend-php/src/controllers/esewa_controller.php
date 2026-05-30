<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/payment_service.php';
require_once __DIR__ . '/../providers/payment_provider_factory.php';

function esewa_create_order(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id']);

  $bookingId = (int)$data['booking_id'];
  $booking = payment_find_booking_for_user($bookingId, (int)$user['id']);
  if (!$booking) json_response(['error' => 'Booking not found'], 404);
  if ($booking['status'] === 'paid') json_response(['error' => 'Already paid'], 409);
  if ($booking['status'] === 'cancelled') json_response(['error' => 'Booking was rejected - cannot pay'], 409);
  if ($booking['status'] !== 'confirmed') {
    json_response(['error' => 'Booking must be approved by agency before payment'], 409);
  }

  $origin = rtrim((string)($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
  if ($origin === '') {
    $config = require __DIR__ . '/../config/config.php';
    $origin = rtrim((string)($config['app']['cors_allow_origin'] ?? 'http://localhost:5173'), '/');
  }

  $defaultReturn = $origin . '/payment/' . $bookingId;
  $returnUrl = trim((string)($data['return_url'] ?? $defaultReturn));
  $failureUrl = trim((string)($data['failure_url'] ?? $defaultReturn));

  $config = require __DIR__ . '/../config/config.php';
  $nprRate = (float)($config['payments']['esewa']['npr_rate'] ?? 133.0);
  $amountNpr = number_format(round((float)$booking['total_usd'] * $nprRate, 2), 2, '.', '');
  $transactionUuid = esewa_build_txn_uuid((string)($booking['booking_code'] ?? ('BOOKING-' . $bookingId)));

  $successUrl = esewa_append_query($returnUrl, [
    'method' => 'esewa',
    'booking_id' => (string)$bookingId,
    'esewa_txn_hint' => $transactionUuid,
    'esewa_amount_hint' => $amountNpr,
  ]);
  $cancelReturn = esewa_append_query($failureUrl, [
    'method' => 'esewa',
    'booking_id' => (string)$bookingId,
    'esewa_status' => 'failed',
    'esewa_txn_hint' => $transactionUuid,
    'esewa_amount_hint' => $amountNpr,
  ]);

  try {
    $provider = PaymentProviderFactory::make('esewa');
    $result = $provider->initiate([
      'booking_code' => (string)($booking['booking_code'] ?? ('BOOKING-' . $bookingId)),
      'transaction_uuid' => $transactionUuid,
      'amount_usd' => (float)$booking['total_usd'],
      'success_url' => $successUrl,
      'failure_url' => $cancelReturn,
    ]);

    if (!($result['ok'] ?? false)) {
      json_response(['error' => $result['error'] ?? 'Unable to create eSewa session'], 422);
    }

    json_response([
      'ok' => true,
      'esewa' => [
        'action_url' => $result['action_url'],
        'fields' => $result['fields'],
      ],
      'transaction_uuid' => $result['transaction_uuid'],
      'amount_npr' => $result['amount_npr'],
    ]);
  } catch (Throwable $e) {
    app_log('esewa_create_order failed', [
      'error' => $e->getMessage(),
      'booking_id' => $bookingId,
    ]);
    json_response([
      'error' => 'eSewa order could not be created',
      'debug' => $e->getMessage(),
    ], 500);
  }
}

function esewa_verify_order(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id']);

  $bookingId = (int)$data['booking_id'];
  $booking = payment_find_booking_for_user($bookingId, (int)$user['id']);
  if (!$booking) json_response(['error' => 'Booking not found'], 404);
  if ($booking['status'] === 'cancelled') json_response(['error' => 'Booking was rejected - cannot pay'], 409);
  if ($booking['status'] !== 'confirmed' && $booking['status'] !== 'paid') {
    json_response(['error' => 'Booking must be approved by agency before payment'], 409);
  }

  $idempotencyKey = trim((string)($data['idempotency_key'] ?? ($_SERVER['HTTP_X_IDEMPOTENCY_KEY'] ?? '')));

  try {
    $provider = PaymentProviderFactory::make('esewa');
  
$rawTotalAmount = (string)($data['total_amount'] ?? ($data['esewa_amount_hint'] ?? ($data['amt'] ?? '')));
$cleanTotalAmount = strtok($rawTotalAmount, '?&') ?: $rawTotalAmount;

$rawTxnUuid = (string)($data['transaction_uuid'] ?? ($data['esewa_txn_hint'] ?? ($data['oid'] ?? '')));
$cleanTxnUuid = strtok($rawTxnUuid, '?&') ?: $rawTxnUuid;

$capture = $provider->capture([
  'data' => (string)($data['data'] ?? ''),
  'status' => (string)($data['status'] ?? ''),
  'transaction_uuid' => $cleanTxnUuid,
  'total_amount' => $cleanTotalAmount,
  'oid' => (string)($data['oid'] ?? ''),
  'amt' => (string)($data['amt'] ?? ''),
  'ref_id' => (string)($data['ref_id'] ?? ($data['refId'] ?? '')),
  'refId' => (string)($data['refId'] ?? ''),
]);

    if (!($capture['ok'] ?? false)) {
      app_log('esewa_verify_order rejected', [
        'booking_id' => $bookingId,
        'error' => $capture['error'] ?? 'unknown',
        'details' => $capture['details'] ?? null,
      ]);
      json_response([
        'error' => $capture['error'] ?? 'Payment verification failed',
        'details' => $capture['details'] ?? null,
      ], 422);
    }

    $config = require __DIR__ . '/../config/config.php';
    $nprRate = (float)($config['payments']['esewa']['npr_rate'] ?? 133.0);
    $expectedAmount = round((float)$booking['total_usd'] * $nprRate, 2);
    $verifiedAmount = (float)($capture['total_amount'] ?? 0);
    if (abs($verifiedAmount - $expectedAmount) > 0.01) {
      app_log('esewa_verify_order amount_mismatch', [
        'booking_id' => $bookingId,
        'expected_amount' => $expectedAmount,
        'verified_amount' => $verifiedAmount,
        'transaction_uuid' => (string)($capture['transaction_uuid'] ?? ''),
      ]);
      json_response(['error' => 'Payment amount mismatch'], 422);
    }

    $providerOrderId = trim((string)($capture['transaction_uuid'] ?? ''));
    if ($providerOrderId === '') {
      json_response(['error' => 'Missing transaction UUID from eSewa verification'], 422);
    }

    $providerRef = trim((string)($capture['transaction_uuid'] ?? ''));
    if ($providerRef === '') {
      $providerRef = trim((string)($capture['ref_id'] ?? ''));
    }

    $finalize = payment_finalize_success($booking, [
      'method' => 'esewa',
      'provider_ref' => $providerRef,
      'provider_order_id' => $providerOrderId,
      'provider_capture_id' => trim((string)($capture['ref_id'] ?? '')),
      'provider_payload_json' => json_encode($capture['raw'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
      'idempotency_key' => $idempotencyKey,
    ]);

    json_response([
      'ok' => true,
      'provider_ref' => $finalize['provider_ref'],
      'transaction_uuid' => trim((string)($capture['transaction_uuid'] ?? '')),
      'ref_id' => trim((string)($capture['ref_id'] ?? '')),
      'earned_points' => $finalize['earned_points'],
      'already_paid' => (bool)($finalize['already_paid'] ?? false),
    ]);

  } catch (Throwable $e) {
    app_log('esewa_verify_order failed', [
      'error' => $e->getMessage(),
      'booking_id' => $bookingId,
    ]);
    json_response([
      'error' => 'eSewa verification could not be completed',
      'debug' => $e->getMessage(),
    ], 500);
  }
}

function esewa_append_query(string $url, array $query): string {
  $parts = parse_url($url);
  $base = ($parts['scheme'] ?? '') !== '' ? ($parts['scheme'] . '://') : '';
  $base .= $parts['host'] ?? '';
  if (isset($parts['port'])) {
    $base .= ':' . $parts['port'];
  }
  $base .= $parts['path'] ?? '';
  $existing = [];
  if (!empty($parts['query']) && is_string($parts['query'])) {
    
  }
  $merged = array_merge($existing, $query);
  $queryString = http_build_query($merged);
  $fragment = isset($parts['fragment']) ? ('#' . $parts['fragment']) : '';
  return $base . ($queryString !== '' ? ('?' . $queryString) : '') . $fragment;
}

function esewa_build_txn_uuid(string $bookingCode): string {
  $normalized = strtoupper(preg_replace('/[^A-Za-z0-9-]/', '-', $bookingCode) ?? '');
  $normalized = trim(preg_replace('/-+/', '-', $normalized) ?? '', '-');
  if ($normalized === '') {
    $normalized = 'BOOKING';
  }
  return date('ymd-His') . '-' . substr($normalized, 0, 12) . '-' . bin2hex(random_bytes(3));
}