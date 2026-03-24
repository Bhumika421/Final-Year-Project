<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

function wishlist_list(array $user): void {
  $stmt = db()->prepare("SELECT w.id as wishlist_id, t.* 
                         FROM wishlist w 
                         JOIN tours t ON t.id=w.tour_id
                         WHERE w.user_id=? ORDER BY w.created_at DESC");
  $stmt->execute([(int)$user['id']]);
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function wishlist_add(array $user): void {
  $data = read_json_body();
  require_fields($data, ['tour_id']);
  $tourId = (int)$data['tour_id'];

  $stmt = db()->prepare("SELECT id FROM wishlist WHERE user_id=? AND tour_id=? LIMIT 1");
  $stmt->execute([(int)$user['id'], $tourId]);
  if ($stmt->fetch()) json_response(['error' => 'Already in your wishlist!'], 409);

  $stmt = db()->prepare("INSERT INTO wishlist (user_id,tour_id) VALUES (?,?)");
  $stmt->execute([(int)$user['id'], $tourId]);
  json_response(['ok'=>true]);
}

function wishlist_remove(array $params, array $user): void {
  $id = (int)$params['id'];
  $stmt = db()->prepare("DELETE FROM wishlist WHERE id=? AND user_id=?");
  $stmt->execute([$id,(int)$user['id']]);
  json_response(['ok'=>true]);
}