<?php
// Copy this file to config.php and update values for your machine.
// IMPORTANT: Do NOT commit real secrets.

return [
  'db' => [
    'host' => '127.0.0.1',
    'name' => 'safe_journey_planner',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
  ],
  'app' => [
    'jwt_secret' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
    'jwt_ttl_minutes' => 60*24, // 24 hours
    'cors_allow_origin' => 'http://localhost:5173',
    'tax_rate' => 0.13, // 13% (edit if needed)
  ]
];
