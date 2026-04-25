<?php
declare(strict_types=1);

function json_response($data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  if (json_last_error() !== JSON_ERROR_NONE) {
    json_response(['error' => 'Invalid JSON body'], 400);
  }
  return is_array($data) ? $data : [];
}

function require_fields(array $data, array $fields): void {
  $missing = [];
  foreach ($fields as $f) {
    if (!isset($data[$f]) || $data[$f] === '') $missing[] = $f;
  }
  if ($missing) json_response(['error' => 'Missing fields', 'fields' => $missing], 422);
}

function now_iso(): string {
  return (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM);
}

function random_code(string $prefix, int $len = 10): string {
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $bytes = random_bytes($len);
  $out = '';
  for ($i=0; $i<$len; $i++) $out .= $alphabet[ord($bytes[$i]) % strlen($alphabet)];
  return $prefix . '-' . $out;
}

function app_log(string $message, array $context = []): void {
  $line = '[' . date('Y-m-d H:i:s') . '] ' . $message;
  if ($context) $line .= ' ' . json_encode($context, JSON_UNESCAPED_SLASHES);
  $line .= PHP_EOL;
  $path = __DIR__ . '/../storage/logs/app.log';
  $dir = dirname($path);
  if (!is_dir($dir)) {
    @mkdir($dir, 0775, true);
  }
  @file_put_contents($path, $line, FILE_APPEND);
}

// --- JWT (HS256) ---
function base64url_encode(string $data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode(string $data): string {
  $remainder = strlen($data) % 4;
  if ($remainder) $data .= str_repeat('=', 4 - $remainder);
  return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_sign(array $payload, string $secret): string {
  $header = ['alg' => 'HS256', 'typ' => 'JWT'];
  $segments = [
    base64url_encode(json_encode($header)),
    base64url_encode(json_encode($payload)),
  ];
  $data = implode('.', $segments);
  $sig = hash_hmac('sha256', $data, $secret, true);
  $segments[] = base64url_encode($sig);
  return implode('.', $segments);
}

function jwt_verify(string $token, string $secret): ?array {
  $parts = explode('.', $token);
  if (count($parts) !== 3) return null;
  [$h,$p,$s] = $parts;
  $data = $h . '.' . $p;
  $sig = base64url_decode($s);
  $expected = hash_hmac('sha256', $data, $secret, true);
  if (!hash_equals($expected, $sig)) return null;
  $payload = json_decode(base64url_decode($p), true);
  if (!is_array($payload)) return null;
  if (isset($payload['exp']) && time() > (int)$payload['exp']) return null;
  return $payload;
}

function get_bearer_token(): ?string {
  $hdr = $_SERVER['HTTP_AUTHORIZATION']
      ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
      ?? getallheaders()['Authorization']
      ?? getallheaders()['authorization']
      ?? '';
  if (!$hdr) return null;
  if (preg_match('/Bearer\s+(.*)$/i', $hdr, $m)) return trim($m[1]);
  return null;
}