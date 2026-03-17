<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

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

  $subtotal = (float)$tour['price_usd'] * count($travelers);

  $config = require __DIR__ . '/../config/config.php';
  $taxRate = (float)$config['app']['tax_rate'];
  $tax = round($subtotal * $taxRate, 2);

  // simple discount using loyalty points (1 point = $0.10, max 20% of subtotal)
  $discount = 0.0;
  if (!empty($data['use_loyalty_points'])) {
    $points = (int)$user['loyalty_points'];
    $maxDisc = $subtotal * 0.20;
    $discount = min($points * 0.10, $maxDisc);
    $discount = round($discount, 2);
  }

  $total = round($subtotal + $tax - $discount, 2);
  $code = random_code('BKG', 10);

  $stmt = db()->prepare("INSERT INTO bookings (user_id,tour_id,travelers_json,subtotal_usd,tax_usd,discount_usd,total_usd,status,booking_code)
                         VALUES (?,?,?,?,?,?,?,?,?)");
  $stmt->execute([
    (int)$user['id'], $tourId, json_encode($travelers),
    $subtotal, $tax, $discount, $total, 'pending', $code
  ]);

  json_response(['ok'=>true, 'booking_id'=>(int)db()->lastInsertId(), 'booking_code'=>$code, 'total_usd'=>$total]);
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

  // day-wise itinerary: from tour itinerary_json
  $stmt = db()->prepare("SELECT itinerary_json FROM tours WHERE id=? LIMIT 1");
  $stmt->execute([(int)$b['tour_id']]);
  $t = $stmt->fetch();
  $b['itinerary'] = $t && $t['itinerary_json'] ? json_decode($t['itinerary_json'], true) : [];
  json_response(['ok'=>true,'booking'=>$b]);
}

function payments_pay(array $user): void {
  $data = read_json_body();
  require_fields($data, ['booking_id','method']);
  $bookingId = (int)$data['booking_id'];
  $method = (string)$data['method'];

  $stmt = db()->prepare("SELECT * FROM bookings WHERE id=? AND user_id=? LIMIT 1");
  $stmt->execute([$bookingId,(int)$user['id']]);
  $b = $stmt->fetch();
  if (!$b) json_response(['error'=>'Booking not found'], 404);
  if ($b['status'] === 'paid') json_response(['error'=>'Already paid'], 409);

  // Demo validation (real gateway integration is out of scope)
  if ($method === 'card') {
    require_fields($data, ['card_number','card_name','expiry','cvv']);
    $card = preg_replace('/\s+/', '', (string)$data['card_number']);
    if (strlen($card) < 12) json_response(['error'=>'Invalid card number'], 422);
    if (!preg_match('/^\d{3,4}$/', (string)$data['cvv'])) json_response(['error'=>'Invalid CVV'], 422);
  }

  $providerRef = random_code('PAY', 12);

  // store payment
  $stmt = db()->prepare("INSERT INTO payments (booking_id,method,amount_usd,currency,provider_ref,status) VALUES (?,?,?,?,?,?)");
  $stmt->execute([$bookingId, $method, (float)$b['total_usd'], 'USD', $providerRef, 'success']);

  // update booking
  db()->prepare("UPDATE bookings SET status='paid' WHERE id=?")->execute([$bookingId]);

  // loyalty points: 1 point per $10
  $earned = (int)floor(((float)$b['total_usd']) / 10.0);
  $spentPoints = 0;
  if ((float)$b['discount_usd'] > 0) {
    $spentPoints = (int)round(((float)$b['discount_usd']) / 0.10);
  }
  db()->prepare("UPDATE users SET loyalty_points = GREATEST(loyalty_points - ?, 0) + ? WHERE id=?")
     ->execute([$spentPoints, $earned, (int)$user['id']]);

  // notification
  db()->prepare("INSERT INTO notifications (user_id,category,title,body) VALUES (?,?,?,?)")
     ->execute([(int)$user['id'], 'booking', 'Payment successful', 'Your booking ' . $b['booking_code'] . ' has been confirmed.']);

  json_response(['ok'=>true, 'provider_ref'=>$providerRef, 'earned_points'=>$earned]);
}


function bookings_list_admin(array $admin): void {
  $stmt = db()->query("SELECT b.*, u.full_name AS customer_name, u.email AS customer_email,
                              t.title, t.destination, t.image_url
                       FROM bookings b
                       JOIN users u ON u.id=b.user_id
                       JOIN tours t ON t.id=b.tour_id
                       ORDER BY b.created_at DESC");
  $items = $stmt->fetchAll();
  foreach ($items as &$it) {
    $it['travelers'] = $it['travelers_json'] ? json_decode($it['travelers_json'], true) : [];
    unset($it['travelers_json']);
  }
  json_response(['ok'=>true,'items'=>$items]);
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
