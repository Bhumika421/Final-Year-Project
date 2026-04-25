<?php
declare(strict_types=1);

function handle_cors(): void {
  // Always read origin from request
  $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

  $allowed = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ];

  if (in_array($requestOrigin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
  } else {
    // Fallback — config bata
    $config = require __DIR__ . '/../config/config.php';
    $origin = $config['app']['cors_allow_origin'] ?? 'http://localhost:5173';
    header('Access-Control-Allow-Origin: ' . $origin);
  }

  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Idempotency-Key');
  header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
  header('Access-Control-Max-Age: 86400');

  // OPTIONS preflight — immediately exit
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}