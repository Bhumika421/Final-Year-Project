<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/payment_service.php';

function get_user_loyalty_tier(int $userId): array {
  $stmt = db()->prepare("SELECT COUNT(*) FROM bookings WHERE user_id=? AND status='paid'");
  $stmt->execute([$userId]);
  $completedCount = (int)$stmt->fetchColumn();

  $tier = 1;
  $name = 'Explorer';
  $discountPct = 0.10;

  if ($completedCount >= 10) {
    $tier = 3;
    $name = 'Elite Traveler';
    $discountPct = 0.20;
  } else if ($completedCount >= 5) {
    $tier = 2;
    $name = 'Adventurer';
    $discountPct = 0.15;
  }

  return [
    'completed_bookings' => $completedCount,
    'tier' => $tier,
    'name' => $name,
    'discount_pct' => $discountPct,
  ];
}

function bookings_create(array $user): void {
  $data = read_json_body();
  require_fields($data, ['tour_id','travelers']);
  $tourId = (int)$data['tour_id'];
  $travelers = $data['travelers'];
  if (!is_array($travelers) || count($travelers) < 1) json_response(['error'=>'At least 1 traveler required'], 422);

  $stmt = db()->prepare("SELECT id, price_usd FROM tours WHERE id=? AND is_active=1");
  $stmt->execute([$tourId]);
  $tour = $stmt->fetch();
  if (!$tour) json_response(['error'=>'Tour not found'], 404);

  $stmt = db()->prepare("SELECT id FROM bookings WHERE user_id=? AND tour_id=? AND status='pending' LIMIT 1");
  $stmt->execute([(int)$user['id'], $tourId]);
  if ($stmt->fetch()) {
    json_response(['error' => 'You already have a pending booking for this tour'], 409);
  }

  $subtotal = (float)$tour['price_usd'] * count($travelers);
  $config = require __DIR__ . '/../config/config.php';
  $taxRate = (float)$config['app']['tax_rate'];
  $tax = round($subtotal * $taxRate, 2);

  $discount = 0.0;
  $discountPct = 0.0;
  $loyaltyTier = 1;

  if (!empty($data['use_loyalty_discount'])) {
    $tierInfo = get_user_loyalty_tier((int)$user['id']);
    $loyaltyTier = $tierInfo['tier'];
    $discountPct = $tierInfo['discount_pct'];
    $discount = round($subtotal * $discountPct, 2);
  }

  $total = round($subtotal + $tax - $discount, 2);
  $code = random_code('BKG', 10);

  $stmt = db()->prepare("INSERT INTO bookings (user_id,tour_id,travelers_json,subtotal_usd,tax_usd,discount_usd,total_usd,status,booking_code)
                         VALUES (?,?,?,?,?,?,?,?,?)");
  $stmt->execute([
    (int)$user['id'], $tourId, json_encode($travelers),
    $subtotal, $tax, $discount, $total, 'pending', $code
  ]);

  $bookingId = (int)db()->lastInsertId();

  // Notify agency about new booking
  $stmt = db()->prepare("SELECT agency_id, title FROM tours WHERE id=? LIMIT 1");
  $stmt->execute([$tourId]);
  $tourRow = $stmt->fetch();
  if ($tourRow && $tourRow['agency_id']) {
    $title = 'New booking request!';
    $body = 'A new booking has been made for "' . $tourRow['title'] . '". Booking code: ' . $code;
    db()->prepare("INSERT INTO notifications (user_id,category,title,body,message) VALUES (?,?,?,?,?)")
      ->execute([$tourRow['agency_id'], 'booking', $title, $body, $body]);
  }

  json_response([
    'ok' => true,
    'booking_id' => $bookingId,
    'booking_code' => $code,
    'total_usd' => $total,
    'loyalty_tier_applied' => $loyaltyTier,
    'discount_pct_applied' => (int)round($discountPct * 100),
  ]);
}

function bookings_list(array $user): void {
  $stmt = db()->prepare("SELECT b.*, t.title, t.destination, t.image_url
                         FROM bookings b JOIN tours t ON t.id=b.tour_id
                         WHERE b.user_id=? ORDER BY b.created_at DESC");
  $stmt->execute([(int)$user['id']]);
  $items = $stmt->fetchAll();
  foreach ($items as &$it) {
    $it['travelers'] = $it['travelers_json'] ? json_decode($it['travelers_json'], true) : [];
    unset($it['travelers_json']);
  }
  json_response(['ok'=>true,'items'=>$items]);
}

function bookings_get(array $params, array $user): void {
  $id = (int)$params['id'];
  $stmt = db()->prepare("SELECT b.*, t.title, t.destination, t.image_url
                         FROM bookings b JOIN tours t ON t.id=b.tour_id
                         WHERE b.id=? AND b.user_id=? LIMIT 1");
  $stmt->execute([$id,(int)$user['id']]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);
  $b['travelers'] = $b['travelers_json'] ? json_decode($b['travelers_json'], true) : [];
  unset($b['travelers_json']);

  $stmt = db()->prepare("SELECT itinerary_json FROM tours WHERE id=? LIMIT 1");
  $stmt->execute([(int)$b['tour_id']]);
  $t = $stmt->fetch();
  $b['itinerary'] = $t && $t['itinerary_json'] ? json_decode($t['itinerary_json'], true) : [];
  json_response(['ok'=>true,'booking'=>$b]);
}


function booking_confirm(array $params, array $agency): void {
  $id = (int)($params['id'] ?? 0);
  if (!$id) json_response(['error' => 'Booking ID required'], 422);

  $db = db();

  $stmt = $db->prepare("
    SELECT b.*, u.full_name as customer_name, u.email as customer_email,
           t.title as tour_title, t.destination, t.duration_days, t.agency_id
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN tours t ON t.id = b.tour_id
    WHERE b.id = ? LIMIT 1
  ");
  $stmt->execute([$id]);
  $booking = $stmt->fetch();

  if (!$booking) json_response(['error' => 'Booking not found'], 404);
  if ((int)$booking['agency_id'] !== (int)$agency['id']) json_response(['error' => 'Forbidden'], 403);
  if ($booking['status'] === 'paid') json_response(['error' => 'Already paid'], 409);
  if ($booking['status'] === 'cancelled') json_response(['error' => 'Booking is already cancelled'], 409);
  if ($booking['status'] === 'confirmed') json_response(['error' => 'Already confirmed'], 409);

  // Update status
  $db->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?")->execute([$id]);

try {
    $config = require __DIR__ . '/../config/config.php';
    $mail   = require_once __DIR__ . '/../config/mailer.php';
    if (!($mail instanceof \PHPMailer\PHPMailer\PHPMailer)) {
        throw new \Exception('Mailer not initialized');
    }

    $customerName  = $booking['customer_name'];
    $customerEmail = $booking['customer_email'];
    $tourTitle     = $booking['tour_title'];
    $destination   = $booking['destination'];
    $duration      = $booking['duration_days'];
    $bookingCode   = $booking['booking_code'];
    $totalNPR      = number_format(round((float)$booking['total_usd'] * 133));

    $mail->addAddress($customerEmail, $customerName);
    $mail->Subject = "Booking Confirmed — {$tourTitle}";
    $mail->isHTML(true);
    $mail->Body = "
      <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e0d; color: #f0ede8; border-radius: 16px; overflow: hidden;'>
        <div style='background: linear-gradient(135deg, #1a2e1a, #0f1e10); padding: 32px; text-align: center;'>
          <h1 style='font-size: 24px; color: #a8d96b; margin: 0;'>Safe Journey Planner</h1>
          <p style='color: rgba(240,237,232,0.6); margin: 8px 0 0;'>Your booking has been confirmed!</p>
        </div>
        <div style='padding: 32px;'>
          <p style='font-size: 16px; margin: 0 0 24px;'>Hello <strong>{$customerName}</strong>,</p>
          <p style='color: rgba(240,237,232,0.7); line-height: 1.6;'>
            Great news! Your booking for <strong style='color: #a8d96b;'>{$tourTitle}</strong> has been confirmed by the agency. Please proceed with the payment to finalize your booking.
          </p>
          <div style='background: rgba(168,217,107,0.08); border: 1px solid rgba(168,217,107,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;'>
            <h3 style='color: #a8d96b; margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;'>Booking Details</h3>
            <table style='width: 100%; border-collapse: collapse;'>
              <tr>
                <td style='color: rgba(240,237,232,0.5); padding: 6px 0; font-size: 14px;'>Booking Code</td>
                <td style='color: #fff; font-weight: 700; text-align: right; font-size: 14px;'>{$bookingCode}</td>
              </tr>
              <tr>
                <td style='color: rgba(240,237,232,0.5); padding: 6px 0; font-size: 14px;'>Tour</td>
                <td style='color: #fff; font-weight: 600; text-align: right; font-size: 14px;'>{$tourTitle}</td>
              </tr>
              <tr>
                <td style='color: rgba(240,237,232,0.5); padding: 6px 0; font-size: 14px;'>Destination</td>
                <td style='color: #fff; font-weight: 600; text-align: right; font-size: 14px;'>{$destination}</td>
              </tr>
              <tr>
                <td style='color: rgba(240,237,232,0.5); padding: 6px 0; font-size: 14px;'>Duration</td>
                <td style='color: #fff; font-weight: 600; text-align: right; font-size: 14px;'>{$duration} days</td>
              </tr>
              <tr style='border-top: 1px solid rgba(168,217,107,0.15);'>
                <td style='color: rgba(240,237,232,0.5); padding: 10px 0 6px; font-size: 14px;'>Total Amount</td>
                <td style='color: #a8d96b; font-weight: 700; text-align: right; font-size: 18px;'>NPR {$totalNPR}</td>
              </tr>
            </table>
          </div>
          <div style='background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
            <p style='color: #60a5fa; margin: 0; font-size: 14px;'>
              Please login to Safe Journey Planner and complete your payment to confirm your spot.
            </p>
          </div>
          <p style='color: rgba(240,237,232,0.5); font-size: 13px; line-height: 1.6;'>
            If you have any questions, you can message the agency directly through our platform.
          </p>
        </div>
        <div style='background: rgba(255,255,255,0.03); padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);'>
          <p style='color: rgba(240,237,232,0.3); font-size: 12px; margin: 0;'>Safe Journey Planner &copy; 2025 &middot; Nepal</p>
        </div>
      </div>
    ";

    $mail->send();
  } catch (\Exception $e) {
    error_log('Email send failed: ' . $e->getMessage());
  }

  //  In-app notification
  try {
    $db->prepare("
      INSERT INTO notifications (user_id, title, body, category, is_read, created_at)
      VALUES (?, ?, ?, 'booking', 0, NOW())
    ")->execute([
      $booking['user_id'],
      "Booking Confirmed — {$booking['tour_title']}",
      "Your booking ({$booking['booking_code']}) has been confirmed. Please proceed with payment.",
    ]);
  } catch (\Exception $e) {
    error_log('Notification failed: ' . $e->getMessage());
  }

  json_response(['ok' => true, 'message' => 'Booking confirmed']);
}

function booking_reject(array $params, array $agency): void {
  $id = (int)$params['id'];
  $data = read_json_body();
  $reason = trim((string)($data['reason'] ?? 'Rejected by agency'));

  $stmt = db()->prepare("SELECT b.*, t.title, t.agency_id FROM bookings b
                         JOIN tours t ON t.id=b.tour_id
                         WHERE b.id=? LIMIT 1");
  $stmt->execute([$id]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);
  if ((int)$b['agency_id'] !== (int)$agency['id']) json_response(['error'=>'Forbidden'], 403);
  if ($b['status'] === 'paid') json_response(['error'=>'Already paid — cannot reject'], 409);
  if ($b['status'] === 'cancelled') json_response(['error'=>'Booking is already cancelled'], 409);

  db()->prepare("UPDATE bookings SET status='cancelled' WHERE id=?")->execute([$id]);

  // Notify customer
  $rejectTitle = 'Booking Rejected';
  $rejectBody = 'Sorry, your booking for "' . $b['title'] . '" (Code: ' . $b['booking_code'] . ') was rejected. Reason: ' . $reason;
  db()->prepare("INSERT INTO notifications (user_id,category,title,body,message) VALUES (?,?,?,?,?)")
    ->execute([$b['user_id'], 'booking', $rejectTitle, $rejectBody, $rejectBody]);

  json_response(['ok'=>true, 'message'=>'Booking rejected']);
}

function payments_pay(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id','method']);
  $bookingId = (int)$data['booking_id'];
  $method = (string)$data['method'];

  $allowedMethods = ['khalti', 'esewa', 'card', 'paypal'];
  if (!in_array($method, $allowedMethods, true)) {
    json_response(['error' => 'Unsupported payment method'], 422);
  }

  $stmt = db()->prepare("SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1");
  $stmt->execute([$bookingId,(int)$user['id']]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);
  if ($b['status'] === 'paid') json_response(['error'=>'Already paid'], 409);
  if ($b['status'] === 'cancelled') json_response(['error'=>'Booking was rejected — cannot pay'], 409);
  if ($b['status'] !== 'confirmed') json_response(['error'=>'Booking must be approved by agency before payment'], 409);

  if ($method === 'card') {
    require_fields($data, ['card_number','card_name','expiry','cvv']);
    $card = preg_replace('/\s+/', '', (string)$data['card_number']);
    if (strlen($card) < 12) json_response(['error'=>'Invalid card number'], 422);
    if (!preg_match('/^\d{3,4}$/', (string)$data['cvv'])) json_response(['error'=>'Invalid CVV'], 422);
  }

  $providerRef = trim((string)($data['provider_ref'] ?? ''));
  $providerOrderId = trim((string)($data['provider_order_id'] ?? ''));
  $providerCaptureId = trim((string)($data['provider_capture_id'] ?? ''));
  if ($providerRef === '') {
    if ($method === 'khalti') $providerRef = trim((string)($data['pidx'] ?? ''));
    elseif ($method === 'esewa') $providerRef = trim((string)($data['ref_id'] ?? ''));
  }
  if ($providerOrderId === '') {
    if ($method === 'khalti') {
      $providerOrderId = trim((string)($data['pidx'] ?? ''));
      if ($providerCaptureId === '') $providerCaptureId = trim((string)($data['transaction_id'] ?? ''));
    } elseif ($method === 'esewa') {
      $providerOrderId = trim((string)($data['transaction_uuid'] ?? ($data['oid'] ?? '')));
      if ($providerCaptureId === '') $providerCaptureId = trim((string)($data['ref_id'] ?? ($data['refId'] ?? '')));
    }
  }

  $idempotencyKey = trim((string)($data['idempotency_key'] ?? ($_SERVER['HTTP_X_IDEMPOTENCY_KEY'] ?? '')));

  $finalize = [];
  try {
    $finalize = payment_finalize_success($b, [
      'method' => $method,
      'provider_ref' => $providerRef,
      'provider_order_id' => $providerOrderId,
      'provider_capture_id' => $providerCaptureId,
      'provider_payload_json' => isset($data['provider_payload']) ? json_encode($data['provider_payload'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '',
      'idempotency_key' => $idempotencyKey,
    ]);
  } catch (Throwable $e) {
    json_response(['error' => $e->getMessage()], 422);
  }

  $newTierInfo = get_user_loyalty_tier((int)$user['id']);

  json_response([
    'ok' => true,
    'provider_ref' => $finalize['provider_ref'],
    'already_paid' => (bool)($finalize['already_paid'] ?? false),
    'loyalty' => [
      'completed_bookings' => $newTierInfo['completed_bookings'],
      'current_tier' => $newTierInfo['tier'],
      'tier_name' => $newTierInfo['name'],
    ],
  ]);
}

function bookings_list_admin(array $admin): void {
  $page  = max(1, (int)($_GET['page'] ?? 1));
  $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
  $offset = ($page - 1) * $limit;

  $total = (int)db()->query("SELECT COUNT(*) FROM bookings")->fetchColumn();

  $stmt = db()->prepare("SELECT b.*, u.full_name AS customer_name, u.email AS customer_email,
                                t.title, t.destination, t.image_url
                         FROM bookings b
                         JOIN users u ON u.id=b.user_id
                         JOIN tours t ON t.id=b.tour_id
                         ORDER BY b.created_at DESC
                         LIMIT :limit OFFSET :offset");
  $stmt->bindValue(':limit',  $limit,  \PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
  $stmt->execute();

  $items = $stmt->fetchAll();
  foreach ($items as &$it) {
    $it['travelers'] = $it['travelers_json'] ? json_decode($it['travelers_json'], true) : [];
    unset($it['travelers_json']);
  }
  json_response([
    'ok'    => true,
    'items' => $items,
    'meta'  => [
      'total'       => $total,
      'page'        => $page,
      'limit'       => $limit,
      'total_pages' => (int)ceil($total / $limit),
    ],
  ]);
}

function bookings_list_agency(array $agency): void {
  $stmt = db()->prepare("SELECT b.*, u.full_name AS customer_name, u.email AS customer_email,
                                t.title, t.destination, t.image_url
                         FROM bookings b
                         JOIN users u ON u.id=b.user_id
                         JOIN tours t ON t.id=b.tour_id
                         WHERE t.agency_id=?
                         ORDER BY b.created_at DESC");
  $stmt->execute([(int)$agency['id']]);
  $items = $stmt->fetchAll();
  foreach ($items as &$it) {
    $it['travelers'] = $it['travelers_json'] ? json_decode($it['travelers_json'], true) : [];
    unset($it['travelers_json']);
  }
  json_response(['ok'=>true,'items'=>$items]);
}

function bookings_delete(array $params, array $user): void {
  $id = (int)$params['id'];
  $stmt = db()->prepare("SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1");
  $stmt->execute([$id, (int)$user['id']]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);
  if ($b['status'] === 'paid') json_response(['error'=>'Paid booking cannot be deleted'], 409);
  db()->prepare("DELETE FROM bookings WHERE id=?")->execute([$id]);
  json_response(['ok'=>true, 'message'=>'Booking deleted']);
}

function bookings_update(array $params, array $user): void {
  $id = (int)$params['id'];
  $data = read_json_body();

  $stmt = db()->prepare("SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1");
  $stmt->execute([$id, (int)$user['id']]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);

  if (in_array($b['status'], ['confirmed', 'paid', 'cancelled'])) {
    json_response(['error' => 'Cannot update a booking with status: ' . $b['status']], 409);
  }

  if (!empty($data['travelers']) && is_array($data['travelers'])) {
    $travelers = $data['travelers'];
    if (count($travelers) < 1) json_response(['error'=>'At least 1 traveler required'], 422);

    $stmt2 = db()->prepare("SELECT price_usd FROM tours WHERE id=? LIMIT 1");
    $stmt2->execute([(int)$b['tour_id']]);
    $tour = $stmt2->fetch();
    if (!$tour) json_response(['error'=>'Tour not found'], 404);

    $config   = require __DIR__ . '/../config/config.php';
    $taxRate  = (float)$config['app']['tax_rate'];
    $subtotal = (float)$tour['price_usd'] * count($travelers);
    $tax      = round($subtotal * $taxRate, 2);
    $oldSubtotal = (float)$b['subtotal_usd'];
    $oldDiscount = (float)$b['discount_usd'];
    $discountPct = $oldSubtotal > 0 ? ($oldDiscount / $oldSubtotal) : 0;
    $discount    = round($subtotal * $discountPct, 2);
    $total       = round($subtotal + $tax - $discount, 2);

    db()->prepare("UPDATE bookings SET travelers_json=?, subtotal_usd=?, tax_usd=?, discount_usd=?, total_usd=? WHERE id=?")
      ->execute([json_encode($travelers), $subtotal, $tax, $discount, $total, $id]);
  }

  json_response(['ok'=>true, 'message'=>'Booking updated']);
}

function refund_request(array $params, array $user): void {
  $id = (int)$params['id'];
  $data = read_json_body();
  $reason = trim((string)($data['reason'] ?? ''));

  $stmt = db()->prepare("SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1");
  $stmt->execute([$id, (int)$user['id']]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);
  if ($b['status'] !== 'paid') json_response(['error'=>'Only paid bookings can request refund'], 409);

  $stmt2 = db()->prepare("SELECT id FROM refund_requests WHERE booking_id=? AND status='pending' LIMIT 1");
  $stmt2->execute([$id]);
  if ($stmt2->fetch()) json_response(['error'=>'Refund already requested'], 409);

  db()->prepare("INSERT INTO refund_requests (booking_id, user_id, reason) VALUES (?,?,?)")
    ->execute([$id, (int)$user['id'], $reason]);

  json_response(['ok'=>true, 'message'=>'Refund request submitted']);
}

function refund_list_admin(): void {
  $stmt = db()->query("SELECT r.*, u.full_name, u.email, b.booking_code, b.total_usd, t.title AS tour_title
                       FROM refund_requests r
                       JOIN users u ON u.id=r.user_id
                       JOIN bookings b ON b.id=r.booking_id
                       JOIN tours t ON t.id=b.tour_id
                       ORDER BY r.created_at DESC");
  json_response(['ok'=>true, 'items'=>$stmt->fetchAll()]);
}

function refund_decide(array $params): void {
  $id = (int)$params['id'];
  $data = read_json_body();
  $status = $data['status'] ?? '';
  $note = trim((string)($data['admin_note'] ?? ''));
  if (!in_array($status, ['approved','rejected'])) json_response(['error'=>'Invalid status'], 422);

  $stmt = db()->prepare("SELECT r.*, b.user_id, b.booking_code, b.discount_usd, t.title FROM refund_requests r
                         JOIN bookings b ON b.id=r.booking_id
                         JOIN tours t ON t.id=b.tour_id
                         WHERE r.id=? LIMIT 1");
  $stmt->execute([$id]);
  $r = $stmt->fetch();
  if (!$r) json_response(['error'=>'Not found'], 404);

  db()->prepare("UPDATE refund_requests SET status=?, admin_note=? WHERE id=?")
    ->execute([$status, $note, $id]);

  if ($status === 'approved') {
    db()->prepare("UPDATE bookings SET status='cancelled' WHERE id=?")
      ->execute([$r['booking_id']]);
  }

  $msg = $status === 'approved'
    ? 'Your refund for "' . $r['title'] . '" (Code: ' . $r['booking_code'] . ') has been approved!'
    : 'Your refund request for "' . $r['title'] . '" was rejected. Note: ' . $note;
  db()->prepare("INSERT INTO notifications (user_id,category,title,body,message) VALUES (?,?,?,?,?)")
    ->execute([$r['user_id'], 'booking', 'Refund ' . ucfirst($status), $msg, $msg]);

  json_response(['ok'=>true]);
}

function loyalty_status(array $user): void {
  $tierInfo = get_user_loyalty_tier((int)$user['id']);

  $nextTier = null;
  if ($tierInfo['tier'] === 1) {
    $nextTier = [
      'level' => 2,
      'name' => 'Adventurer',
      'discount_pct' => 15,
      'bookings_needed' => max(0, 5 - $tierInfo['completed_bookings']),
    ];
  } else if ($tierInfo['tier'] === 2) {
    $nextTier = [
      'level' => 3,
      'name' => 'Elite Traveler',
      'discount_pct' => 20,
      'bookings_needed' => max(0, 10 - $tierInfo['completed_bookings']),
    ];
  }

  json_response([
    'ok' => true,
    'completed_bookings' => $tierInfo['completed_bookings'],
    'current_tier' => [
      'level' => $tierInfo['tier'],
      'name' => $tierInfo['name'],
      'discount_pct' => (int)round($tierInfo['discount_pct'] * 100),
    ],
    'next_tier' => $nextTier,
  ]);
}