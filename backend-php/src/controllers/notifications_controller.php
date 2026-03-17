<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

function notifications_list(array $user): void {
  $stmt = db()->prepare("SELECT * FROM notifications WHERE user_id=? AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC");
  $stmt->execute([(int)$user['id']]);
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function notifications_mark_read(array $params, array $user): void {
  $id = (int)$params['id'];
  db()->prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?")->execute([$id,(int)$user['id']]);
  json_response(['ok'=>true]);
}

function admin_notify_broadcast(array $admin): void {
  $data = read_json_body();
  require_fields($data, ['title','body','category']);
  $category = (string)$data['category'];
  $expires = $data['expires_at'] ?? null;

  // send to all active customers
  $users = db()->query("SELECT id FROM users WHERE is_active=1")->fetchAll();
  $stmt = db()->prepare("INSERT INTO notifications (user_id,category,title,body,expires_at) VALUES (?,?,?,?,?)");
  foreach ($users as $u) {
    $stmt->execute([(int)$u['id'], $category, trim((string)$data['title']), trim((string)$data['body']), $expires]);
  }
  json_response(['ok'=>true,'sent'=>count($users)]);
}
