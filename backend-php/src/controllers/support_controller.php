<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

function support_create(?array $user): void {
  $data = read_json_body();
  require_fields($data, ['name','email','category','message']);
  $ticket = random_code('TCK', 10);

  db()->prepare("INSERT INTO support_tickets (ticket_code,user_id,name,email,category,message,status) VALUES (?,?,?,?,?,?,?)")
     ->execute([$ticket, $user ? (int)$user['id'] : null, trim((string)$data['name']), strtolower(trim((string)$data['email'])),
                trim((string)$data['category']), trim((string)$data['message']), 'open']);

  json_response(['ok'=>true,'ticket_code'=>$ticket]);
}

function support_my(array $user): void {
  $stmt = db()->prepare("SELECT * FROM support_tickets WHERE user_id=? ORDER BY created_at DESC");
  $stmt->execute([(int)$user['id']]);
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function admin_support_list(array $admin): void {
  $stmt = db()->query("SELECT * FROM support_tickets ORDER BY created_at DESC");
  json_response(['ok'=>true,'items'=>$stmt->fetchAll()]);
}

function admin_support_reply(array $params, array $admin): void {
  $id = (int)$params['id'];
  $data = read_json_body();
  require_fields($data, ['reply']);
  db()->prepare("UPDATE support_tickets SET admin_reply=?, status='answered' WHERE id=?")->execute([trim((string)$data['reply']), $id]);
  json_response(['ok'=>true]);
}
