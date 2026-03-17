<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';


function ensure_agency_owns_tour(int $tourId, array $actor): void {
  if (($actor['role'] ?? '') !== 'agency') return;
  $stmt = db()->prepare("SELECT id FROM tours WHERE id=? AND agency_id=? LIMIT 1");
  $stmt->execute([$tourId, (int)$actor['id']]);
  if (!$stmt->fetch()) json_response(['error'=>'Forbidden: not your tour'], 403);
}


function tours_list(): void {
  $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
  $destination = isset($_GET['destination']) ? trim((string)$_GET['destination']) : '';
  $category = isset($_GET['category']) ? trim((string)$_GET['category']) : '';
  $minPrice = isset($_GET['minPrice']) ? (float)$_GET['minPrice'] : null;
  $maxPrice = isset($_GET['maxPrice']) ? (float)$_GET['maxPrice'] : null;

  // Public list: only approved + active tours
  $sql = "SELECT id,title,destination,category,duration_days,price_usd,rating,image_url,description,latitude,longitude
          FROM tours WHERE is_active=1 AND approval_status='approved'";
  $params = [];

  if ($q !== '') { $sql .= " AND (title LIKE ? OR destination LIKE ? OR category LIKE ?)"; $params[]="%$q%"; $params[]="%$q%"; $params[]="%$q%"; }
  if ($destination !== '') { $sql .= " AND destination=?"; $params[]=$destination; }
  if ($category !== '') { $sql .= " AND category=?"; $params[]=$category; }
  if ($minPrice !== null) { $sql .= " AND price_usd >= ?"; $params[]=$minPrice; }
  if ($maxPrice !== null) { $sql .= " AND price_usd <= ?"; $params[]=$maxPrice; }

  $sql .= " ORDER BY rating DESC, created_at DESC";
  $stmt = db()->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll();

  json_response(['ok'=>true,'items'=>$rows]);
}

function tours_list_my(array $agency): void {
  $stmt = db()->prepare(
    "SELECT id,title,destination,category,duration_days,price_usd,rating,image_url,description,is_active,approval_status,rejection_reason,created_at
     FROM tours WHERE agency_id=? ORDER BY created_at DESC"
  );
  $stmt->execute([(int)$agency['id']]);
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function tours_get(array $params): void {
  $id = (int)$params['id'];
  $stmt = db()->prepare("SELECT * FROM tours WHERE id=? LIMIT 1");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) json_response(['error'=>'Tour not found'], 404);
  $row['itinerary'] = $row['itinerary_json'] ? json_decode($row['itinerary_json'], true) : [];
  unset($row['itinerary_json']);
  json_response(['ok'=>true,'tour'=>$row]);
}

function tours_create(array $actor): void {
  $data = read_json_body();
  require_fields($data, ['title','destination','category','duration_days','price_usd']);
  $itinerary = $data['itinerary'] ?? [];
  $isAgency = (($actor['role'] ?? '') === 'agency');
  $agencyId = $isAgency ? (int)$actor['id'] : ($data['agency_id'] ?? null);

  // Agency-submitted packages go to pending review.
  $approvalStatus = $isAgency ? 'pending' : 'approved';
  $isActive = $isAgency ? 0 : 1;
  $approvedBy = $isAgency ? null : (int)$actor['id'];

  $stmt = db()->prepare(
    "INSERT INTO tours (
      title,destination,category,duration_days,price_usd,rating,image_url,description,itinerary_json,latitude,longitude,
      agency_id,approval_status,approved_by,approved_at,rejection_reason,is_active
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NULL,?)"
  );
  $stmt->execute([
    trim((string)$data['title']),
    trim((string)$data['destination']),
    trim((string)$data['category']),
    (int)$data['duration_days'],
    (float)$data['price_usd'],
    isset($data['rating']) ? (float)$data['rating'] : 4.5,
    $data['image_url'] ?? null,
    $data['description'] ?? null,
    json_encode($itinerary),
    $data['latitude'] ?? null,
    $data['longitude'] ?? null,
    $agencyId,
    $approvalStatus,
    $approvedBy,
    $isActive,
  ]);
  json_response(['ok'=>true,'id'=>(int)db()->lastInsertId()]);
}

function tours_update(array $params, array $actor): void {
  $id = (int)$params['id'];
  $data = read_json_body();
  $stmt = db()->prepare("SELECT id FROM tours WHERE id=?");
  $stmt->execute([$id]);
  if (!$stmt->fetch()) json_response(['error'=>'Tour not found'], 404);
  ensure_agency_owns_tour($id, $actor);

  $fields = [];
  $vals = [];
  $map = ['title','destination','category','duration_days','price_usd','rating','image_url','description','latitude','longitude','is_active'];
  foreach ($map as $k) {
    if (array_key_exists($k, $data)) { $fields[] = "$k=?"; $vals[] = $data[$k]; }
  }
  if (array_key_exists('itinerary', $data)) { $fields[] = "itinerary_json=?"; $vals[] = json_encode($data['itinerary']); }
  if (!$fields) json_response(['error'=>'No fields to update'], 422);

  $vals[] = $id;
  $sql = "UPDATE tours SET " . implode(',', $fields) . " WHERE id=?";
  db()->prepare($sql)->execute($vals);
  json_response(['ok'=>true]);
}

function tours_delete(array $params, array $actor): void {
  $id = (int)$params['id'];
  // prevent deletion if active bookings exist
  $stmt = db()->prepare("SELECT COUNT(*) c FROM bookings WHERE tour_id=? AND status IN ('pending','paid')");
  $stmt->execute([$id]);
  $c = (int)($stmt->fetch()['c'] ?? 0);
  if ($c > 0) json_response(['error'=>'Cannot delete tour with active bookings. Deactivate it instead.'], 409);

  db()->prepare("DELETE FROM tours WHERE id=?")->execute([$id]);
  json_response(['ok'=>true]);
}
