<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

function admin_agencies_pending(): void {
  $stmt = db()->prepare(
    "SELECT id, full_name, email, business_name, license_no, verification_status, created_at
     FROM users WHERE role='agency' AND verification_status='pending' ORDER BY created_at DESC"
  );
  $stmt->execute();
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function admin_agency_verify(array $params): void {
  $agencyId = (int)$params['id'];
  $data = read_json_body();
  $status = strtolower(trim((string)($data['status'] ?? '')));
  if (!in_array($status, ['verified','rejected'], true)) {
    json_response(['error'=>'status must be verified or rejected'], 422);
  }
  $reason = isset($data['reason']) ? trim((string)$data['reason']) : null;

  $stmt = db()->prepare("SELECT id FROM users WHERE id=? AND role='agency' LIMIT 1");
  $stmt->execute([$agencyId]);
  if (!$stmt->fetch()) json_response(['error'=>'Agency not found'], 404);

  db()->prepare("UPDATE users SET verification_status=?, verification_reason=? WHERE id=?")
     ->execute([$status, $reason, $agencyId]);

  json_response(['ok'=>true]);
}

function admin_tours_pending(): void {
  $stmt = db()->prepare(
    "SELECT t.id, t.title, t.destination, t.category, t.duration_days, t.price_usd, t.rating, t.created_at,
            u.business_name, u.full_name AS agency_contact, u.email AS agency_email
     FROM tours t
     LEFT JOIN users u ON u.id=t.agency_id
     WHERE t.approval_status='pending'
     ORDER BY t.created_at DESC"
  );
  $stmt->execute();
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function admin_tour_decide(array $params, array $admin): void {
  $tourId = (int)$params['id'];
  $data = read_json_body();
  $decision = strtolower(trim((string)($data['decision'] ?? '')));
  if (!in_array($decision, ['approved','rejected'], true)) {
    json_response(['error'=>'decision must be approved or rejected'], 422);
  }
  $reason = isset($data['reason']) ? trim((string)$data['reason']) : null;

  $stmt = db()->prepare('SELECT id FROM tours WHERE id=? LIMIT 1');
  $stmt->execute([$tourId]);
  if (!$stmt->fetch()) json_response(['error'=>'Tour not found'], 404);

  if ($decision === 'approved') {
    db()->prepare("UPDATE tours SET approval_status='approved', approved_by=?, approved_at=NOW(), rejection_reason=NULL, is_active=1 WHERE id=?")
      ->execute([(int)$admin['id'], $tourId]);
  } else {
    db()->prepare("UPDATE tours SET approval_status='rejected', rejection_reason=?, approved_by=?, approved_at=NOW(), is_active=0 WHERE id=?")
      ->execute([$reason, (int)$admin['id'], $tourId]);
  }

  json_response(['ok'=>true]);
}


function admin_tours_list_all(): void {
  $stmt = db()->prepare(
    "SELECT t.id, t.title, t.destination, t.category, t.duration_days, t.price_usd, t.rating, t.image_url, t.is_active,
            t.approval_status, t.created_at,
            u.business_name
     FROM tours t
     LEFT JOIN users u ON u.id=t.agency_id
     ORDER BY t.created_at DESC"
  );
  $stmt->execute();
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}
