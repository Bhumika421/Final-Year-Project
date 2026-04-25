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
  ],
  'payments' => [
    'enabled_methods' => ['khalti', 'esewa', 'card', 'paypal'],
    'esewa' => [
      'merchant_code' => 'EPAYTEST',
      'secret_key' => '8gBm/:&EnhH.1/q',
      'form_url' => 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      'verify_url' => 'https://rc.esewa.com.np/api/epay/transaction/status/',
      'npr_rate' => 133.0,
    ],
    'khalti' => [
      'secret_key' => 'KHALTI_TEST_SECRET_KEY',
      'initiate_url' => 'https://a.khalti.com/api/v2/epayment/initiate/',
      'lookup_url' => 'https://dev.khalti.com/api/v2/epayment/lookup/',
      'website_url' => 'http://localhost:5173',
      'npr_rate' => 133.0,
    ],
    'paypal' => [
      'mode' => 'sandbox',
      'client_id' => 'PAYPAL_CLIENT_ID',
      'client_secret' => 'PAYPAL_CLIENT_SECRET',
    ],
  ],
];
