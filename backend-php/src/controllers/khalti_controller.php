<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/payment_service.php';
require_once __DIR__ . '/../providers/payment_provider_factory.php';

function khalti_create_order(array $user): void {
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
  $returnUrl = khalti_append_query($returnUrl, ['method' => 'khalti']);

  $purchaseOrderId = 'BKG-' . (string)($booking['booking_code'] ?? ('ID-' . $bookingId));

  try {
    $provider = PaymentProviderFactory::make('khalti');
    $result = $provider->initiate([
      'amount_usd' => (float)$booking['total_usd'],
      'return_url' => $returnUrl,
      'website_url' => $origin,
      'purchase_order_id' => $purchaseOrderId,
      'purchase_order_name' => 'Booking ' . (string)($booking['booking_code'] ?? ('#' . $bookingId)),
    ]);

    if (!($result['ok'] ?? false)) {
      app_log('khalti_create_order rejected', [
        'booking_id' => $bookingId,
        'error' => $result['error'] ?? 'unknown',
        'details' => $result['details'] ?? null,
      ]);
      json_response([
        'error' => $result['error'] ?? 'Unable to create Khalti session',
        'details' => $result['details'] ?? null,
      ], 422);
    }

    json_response([
      'ok' => true,
      'payment_url' => $result['payment_url'],
      'pidx' => $result['pidx'],
      'amount_paisa' => $result['amount_paisa'],
      'amount_npr' => $result['amount_npr'],
      'purchase_order_id' => $purchaseOrderId,
    ]);
  } catch (Throwable $e) {
    app_log('khalti_create_order failed', [
      'error' => $e->getMessage(),
      'booking_id' => $bookingId,
    ]);
    json_response(['error' => 'Khalti order could not be created'], 500);
  }
}

function khalti_verify_order(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id', 'pidx']);

  $bookingId = (int)$data['booking_id'];
  $booking = payment_find_booking_for_user($bookingId, (int)$user['id']);
  if (!$booking) json_response(['error' => 'Booking not found'], 404);
  if ($booking['status'] === 'cancelled') json_response(['error' => 'Booking was rejected - cannot pay'], 409);
  if ($booking['status'] !== 'confirmed' && $booking['status'] !== 'paid') {
    json_response(['error' => 'Booking must be approved by agency before payment'], 409);
  }

  $idempotencyKey = trim((string)($data['idempotency_key'] ?? ($_SERVER['HTTP_X_IDEMPOTENCY_KEY'] ?? '')));
  $pidx = trim((string)$data['pidx']);
  $purchaseOrderId = 'BKG-' . (string)($booking['booking_code'] ?? ('ID-' . $bookingId));

  try {
    $provider = PaymentProviderFactory::make('khalti');
    $capture = $provider->capture([
      'pidx' => $pidx,
      'expected_purchase_order_id' => $purchaseOrderId,
    ]);

    if (!($capture['ok'] ?? false)) {
      app_log('khalti_verify_order rejected', [
        'booking_id' => $bookingId,
        'pidx' => $pidx,
        'error' => $capture['error'] ?? 'unknown',
        'details' => $capture['details'] ?? null,
      ]);
      json_response([
        'error' => $capture['error'] ?? 'Khalti verification failed',
        'details' => $capture['details'] ?? null,
      ], 422);
    }

    $config = require __DIR__ . '/../config/config.php';
    $nprRate = (float)($config['payments']['khalti']['npr_rate'] ?? 133.0);
    $expectedPaisa = (int)round(round((float)$booking['total_usd'] * $nprRate, 2) * 100);
    $verifiedPaisa = (int)($capture['amount_paisa'] ?? 0);
    if ($verifiedPaisa !== $expectedPaisa) {
      app_log('khalti_verify_order amount_mismatch', [
        'booking_id' => $bookingId,
        'pidx' => $pidx,
        'expected_paisa' => $expectedPaisa,
        'verified_paisa' => $verifiedPaisa,
      ]);
      json_response(['error' => 'Payment amount mismatch'], 422);
    }

    $providerRef = trim((string)($capture['transaction_id'] ?? ''));
    if ($providerRef === '') {
      $providerRef = $pidx;
    }

    $finalize = payment_finalize_success($booking, [
      'method' => 'khalti',
      'provider_ref' => $providerRef,
      'provider_order_id' => $pidx,
      'provider_capture_id' => trim((string)($capture['transaction_id'] ?? '')),
      'provider_payload_json' => json_encode($capture['raw'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
      'idempotency_key' => $idempotencyKey,
    ]);

    json_response([
      'ok' => true,
      'provider_ref' => $finalize['provider_ref'],
      'pidx' => $pidx,
      'transaction_id' => trim((string)($capture['transaction_id'] ?? '')),
      'earned_points' => $finalize['earned_points'],
      'already_paid' => (bool)($finalize['already_paid'] ?? false),
    ]);
  } catch (Throwable $e) {
    app_log('khalti_verify_order failed', [
      'error' => $e->getMessage(),
      'booking_id' => $bookingId,
      'pidx' => $pidx,
    ]);
    json_response(['error' => 'Khalti verification could not be completed'], 500);
  }
}

function khalti_append_query(string $url, array $query): string {
  $parts = parse_url($url);

  $base = ($parts['scheme'] ?? '') !== '' ? ($parts['scheme'] . '://') : '';
  $base .= $parts['host'] ?? '';
  if (isset($parts['port'])) {
    $base .= ':' . $parts['port'];
  }
  $base .= $parts['path'] ?? '';

  $existing = [];
  if (!empty($parts['query'])) {
    parse_str($parts['query'], $existing);
  }
  $merged = array_merge($existing, $query);
  $queryString = http_build_query($merged);
  $fragment = isset($parts['fragment']) ? ('#' . $parts['fragment']) : '';

  return $base . ($queryString !== '' ? ('?' . $queryString) : '') . $fragment;
}
