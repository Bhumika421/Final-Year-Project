<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

function payment_find_booking_for_user(int $bookingId, int $userId): ?array {
  $stmt = db()->prepare('SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1');
  $stmt->execute([$bookingId, $userId]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function payment_finalize_success(array $booking, array $payload): array {
  $pdo = db();
  $bookingId = (int)$booking['id'];
  $userId = (int)$booking['user_id'];

  $method = (string)($payload['method'] ?? 'card');
  $allowedMethods = ['khalti', 'esewa', 'card', 'paypal'];
  if (!in_array($method, $allowedMethods, true)) {
    throw new RuntimeException('Unsupported payment method');
  }

  $providerRef = (string)($payload['provider_ref'] ?? '');
  if ($providerRef === '') {
    $providerRef = random_code('PAY', 12);
  }

  $idempotencyKey = trim((string)($payload['idempotency_key'] ?? ''));
  $providerOrderId = trim((string)($payload['provider_order_id'] ?? ''));
  $providerCaptureId = (string)($payload['provider_capture_id'] ?? '');
  $providerPayloadJson = (string)($payload['provider_payload_json'] ?? '');

  if (($method === 'esewa' || $method === 'khalti') && $providerOrderId === '') {
    throw new RuntimeException('Missing provider transaction reference');
  }

  $pdo->beginTransaction();
  try {
    $lock = $pdo->prepare('SELECT * FROM bookings WHERE id=? FOR UPDATE');
    $lock->execute([$bookingId]);
    $freshBooking = $lock->fetch();
    if (!$freshBooking) {
      throw new RuntimeException('Booking not found');
    }

    if ($freshBooking['status'] === 'paid') {
      $existingStmt = $pdo->prepare("SELECT provider_ref FROM payments WHERE booking_id=? AND status='paid' ORDER BY id DESC LIMIT 1");
      $existingStmt->execute([$bookingId]);
      $existing = $existingStmt->fetch();

      $pdo->commit();
      return [
        'provider_ref' => (string)($existing['provider_ref'] ?? $providerRef),
        'already_paid' => true,
      ];
    }

    if ($freshBooking['status'] === 'cancelled') {
      throw new RuntimeException('Booking was rejected - cannot pay');
    }

    if ($idempotencyKey !== '') {
      $idemp = $pdo->prepare("SELECT provider_ref FROM payments WHERE booking_id=? AND idempotency_key=? AND status='paid' LIMIT 1");
      $idemp->execute([$bookingId, $idempotencyKey]);
      $existing = $idemp->fetch();
      if ($existing) {
        $pdo->commit();
        return [
          'provider_ref' => (string)$existing['provider_ref'],
          'already_paid' => true,
        ];
      }
    }

    if ($providerOrderId !== '') {
      $dupTxn = $pdo->prepare("SELECT provider_ref FROM payments WHERE method=? AND provider_order_id=? AND status='paid' LIMIT 1");
      $dupTxn->execute([$method, $providerOrderId]);
      $existingTxn = $dupTxn->fetch();
      if ($existingTxn) {
        $pdo->commit();
        return [
          'provider_ref' => (string)$existingTxn['provider_ref'],
          'already_paid' => true,
        ];
      }
    }

    $amountUsd = (float)$freshBooking['total_usd'];

    $ins = $pdo->prepare('INSERT INTO payments (booking_id,method,amount_usd,currency,provider_ref,provider_order_id,provider_capture_id,provider_payload_json,idempotency_key,status) VALUES (?,?,?,?,?,?,?,?,?,?)');
    $ins->execute([
      $bookingId,
      $method,
      $amountUsd,
      'USD',
      $providerRef,
      $providerOrderId !== '' ? $providerOrderId : null,
      $providerCaptureId !== '' ? $providerCaptureId : null,
      $providerPayloadJson !== '' ? $providerPayloadJson : null,
      $idempotencyKey !== '' ? $idempotencyKey : null,
      'paid',
    ]);

    $pdo->prepare("UPDATE bookings SET status='paid' WHERE id=?")->execute([$bookingId]);

    // Tier-based system: No points calculation needed.
    // Tier auto-updates because it's derived from COUNT(paid bookings).

    $paidTitle = 'Payment successful!';
    $paidBody = 'Your booking ' . $freshBooking['booking_code'] . ' has been paid. Thank you!';
    $pdo->prepare('INSERT INTO notifications (user_id,category,title,body,message) VALUES (?,?,?,?,?)')
      ->execute([$userId, 'booking', $paidTitle, $paidBody, $paidBody]);

    $stmt = $pdo->prepare('SELECT agency_id, title FROM tours WHERE id=? LIMIT 1');
    $stmt->execute([(int)$freshBooking['tour_id']]);
    $tourRow = $stmt->fetch();
    if ($tourRow && $tourRow['agency_id']) {
      $agencyPaidTitle = 'Payment received!';
      $agencyPaidBody = 'Booking ' . $freshBooking['booking_code'] . ' for "' . $tourRow['title'] . '" has been paid.';
      $pdo->prepare('INSERT INTO notifications (user_id,category,title,body,message) VALUES (?,?,?,?,?)')
        ->execute([(int)$tourRow['agency_id'], 'booking', $agencyPaidTitle, $agencyPaidBody, $agencyPaidBody]);
    }

    $pdo->commit();

    return [
      'provider_ref' => $providerRef,
      'already_paid' => false,
    ];
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    if ((int)$e->getCode() === 23000) {
      if ($providerOrderId !== '') {
        $dupTxn = $pdo->prepare("SELECT provider_ref FROM payments WHERE method=? AND provider_order_id=? AND status='paid' LIMIT 1");
        $dupTxn->execute([$method, $providerOrderId]);
        $existingTxn = $dupTxn->fetch();
        if ($existingTxn) {
          return [
            'provider_ref' => (string)$existingTxn['provider_ref'],
            'already_paid' => true,
          ];
        }
      }
    }

    throw $e;
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $e;
  }
}