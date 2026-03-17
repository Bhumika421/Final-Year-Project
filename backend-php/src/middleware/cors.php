<?php
declare(strict_types=1);

function handle_cors(): void {
  $config = require __DIR__ . '/../config/config.php';
  $origin = $config['app']['cors_allow_origin'] ?? '*';

  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}
