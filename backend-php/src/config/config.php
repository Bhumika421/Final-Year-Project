<?php
// App configuration and update values for your machine.
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
    'jwt_secret' => 'dev_secret_change_me_please',
    'jwt_ttl_minutes' => 60*24, // 24 hours
    'cors_allow_origin' => 'http://localhost:5173',
    'tax_rate' => 0.13, // 13% (edit if needed)
    // Extra verification layer for admin logins.
    // Change this to a private value on your machine.
    'admin_login_code' => 'ADMIN-LOGIN-2026',
    // One-time setup code to create the very first admin account (only one admin account is allowed).
    'admin_setup_code' => 'ADMIN-SETUP-2026',
  ]
];
