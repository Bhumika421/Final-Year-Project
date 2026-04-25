<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/payment_service.php';
require_once __DIR__ . '/../providers/payment_provider_factory.php';

function paypal_create_order(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id']);

  $bookingId = (int)$data['booking_id'];
  $booking = payment_find_booking_for_user($bookingId, (int)$user['id']);
  if (!$booking) json_response(['error' => 'Booking not found'], 404);
  if ($booking['status'] === 'paid') json_response(['error' => 'Already paid'], 409);
  if ($booking['status'] === 'cancelled') json_response(['error' => 'Booking was rejected - cannot pay'], 409);
  if ($booking['status'] !== 'confirmed') json_response(['error' => 'Booking must be approved by agency before payment'], 409);

  $origin = rtrim((string)($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
  if ($origin === '') {
    $config = require __DIR__ . '/../config/config.php';
    $origin = rtrim((string)($config['app']['cors_allow_origin'] ?? 'http://localhost:5173'), '/');
  }

  $defaultReturn = $origin . '/payment/' . $bookingId;
  $returnUrl = trim((string)($data['return_url'] ?? $defaultReturn));
  $cancelUrl = trim((string)($data['cancel_url'] ?? ($returnUrl . '?paypal_cancelled=1')));

  try {
    $provider = PaymentProviderFactory::make('paypal');
    $result = $provider->initiate([
      'booking_code' => (string)($booking['booking_code'] ?? ('BOOKING-' . $bookingId)),
      'description' => 'Tour booking payment',
      'amount_usd' => (float)$booking['total_usd'],
      'return_url' => $returnUrl,
      'cancel_url' => $cancelUrl,
    ]);

    if (!($result['ok'] ?? false)) {
      app_log('paypal_create_order rejected', [
        'booking_id' => $bookingId,
        'error' => $result['error'] ?? 'unknown',
        'paypal_raw' => $result['raw'] ?? null,
      ]);
      json_response([
        'error' => $result['error'] ?? 'Unable to create PayPal order',
        'code' => 'PAYPAL_CREATE_FAILED',
      ], 422);
    }

    json_response([
      'ok' => true,
      'order_id' => $result['order_id'],
      'approval_url' => $result['approval_url'],
    ]);
  } catch (Throwable $e) {
    app_log('paypal_create_order failed', ['error' => $e->getMessage(), 'booking_id' => $bookingId]);
    json_response(['error' => 'PayPal order could not be created'], 500);
  }
}

function paypal_capture_order(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id', 'order_id']);

  $bookingId = (int)$data['booking_id'];
  $orderId = trim((string)$data['order_id']);
  $booking = payment_find_booking_for_user($bookingId, (int)$user['id']);
  if (!$booking) json_response(['error' => 'Booking not found'], 404);
  if ($booking['status'] !== 'confirmed' && $booking['status'] !== 'paid') {
    json_response(['error' => 'Booking must be approved by agency before payment'], 409);
  }
  if ($booking['status'] === 'cancelled') json_response(['error' => 'Booking was rejected - cannot pay'], 409);

  $idempotencyKey = trim((string)($data['idempotency_key'] ?? ($_SERVER['HTTP_X_IDEMPOTENCY_KEY'] ?? '')));

  try {
    $provider = PaymentProviderFactory::make('paypal');
    $capture = $provider->capture(['order_id' => $orderId]);

    if (!($capture['ok'] ?? false)) {
      json_response(['error' => $capture['error'] ?? 'PayPal capture failed'], 422);
    }

    $providerRef = (string)($capture['capture_id'] ?? '');
    if ($providerRef === '') {
      $providerRef = (string)$orderId;
    }

    $finalize = payment_finalize_success($booking, [
      'method' => 'paypal',
      'provider_ref' => $providerRef,
      'provider_order_id' => (string)($capture['order_id'] ?? $orderId),
      'provider_capture_id' => (string)($capture['capture_id'] ?? ''),
      'provider_payload_json' => json_encode($capture['raw'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
      'idempotency_key' => $idempotencyKey,
    ]);

    json_response([
      'ok' => true,
      'provider_ref' => $finalize['provider_ref'],
      'earned_points' => $finalize['earned_points'],
      'already_paid' => (bool)($finalize['already_paid'] ?? false),
    ]);
  } catch (Throwable $e) {
    app_log('paypal_capture_order failed', ['error' => $e->getMessage(), 'booking_id' => $bookingId, 'order_id' => $orderId]);
    json_response(['error' => 'PayPal capture could not be completed'], 500);
  }
}
