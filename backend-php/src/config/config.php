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
  ],
  'payments' => [
    'enabled_methods' => ['khalti', 'esewa', 'card', 'paypal'],
    'esewa' => [
  'merchant_code' => 'EPAYTEST',
  'secret_key'    => '8gBm/:&EnhH.1/q',
  'form_url'      => 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  'verify_url'    => 'https://rc-epay.esewa.com.np/api/epay/transaction/status/',
  'npr_rate'      => 133.0,
],
    'khalti' => [
      'secret_key' => 'b53fe42044e241a989f249272b067b60',
      'initiate_url' => 'https://a.khalti.com/api/v2/epayment/initiate/',
      'lookup_url' => 'https://a.khalti.com/api/v2/epayment/lookup/',
      'website_url' => 'http://localhost:5173',
      'npr_rate' => 133.0,
    ],
    'paypal' => [
      'mode' => 'sandbox', // sandbox|live
      'client_id' => 'AerzdQRpQQrS16_aieFI-RXBUdVMlo9cH_Ek_tgWuzLYh-qhCCecoSzxsNKUzKM5RmBCCpCRlBUIl85K',
      'client_secret' => 'EBy89-iG4Vk3PtQ6KEMKWkytoOvLIC3mAA128W24vsfBh3U2wlKmGWzEF23xuitiLOknBR103CANxC6u',
    ],
  ],
  'mail' => [
    'host'     => 'smtp.gmail.com',
    'port'     => 587,
    'username' => 'sthabhumika066@gmail.com', // your gmail
    'password' => 'wuib dddc diuv tbsy', // app password for your gmail (generate this in your Google Account settings)
    'from_email'     => 'sthabhumika066@gmail.com',
    'from_name'=> 'Safe Journey Planner',
],
];

