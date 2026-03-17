<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../db.php';

function require_auth(): array {
  $config = require __DIR__ . '/../config/config.php';
  $token = get_bearer_token();
  if (!$token) json_response(['error' => 'Missing Authorization token'], 401);

  $payload = jwt_verify($token, $config['app']['jwt_secret']);
  if (!$payload || empty($payload['uid'])) json_response(['error' => 'Invalid or expired token'], 401);

  $stmt = db()->prepare('SELECT id, full_name, email, role, is_active, verification_status, business_name FROM users WHERE id=? LIMIT 1');
  $stmt->execute([(int)$payload['uid']]);
  $user = $stmt->fetch();
  if (!$user || (int)$user['is_active'] !== 1) json_response(['error' => 'Account inactive'], 403);
  return $user;
}

function require_admin(): array {
  return require_role(['admin']);
}

function require_role(array $allowed): array {
  $user = require_auth();
  $role = $user['role'] ?? '';
  if (!in_array($role, $allowed, true)) {
    json_response(['error' => 'Forbidden: role not allowed', 'required' => $allowed, 'role' => $role], 403);
  }
  return $user;
}

function require_agency(): array {
  return require_role(['agency']);
}