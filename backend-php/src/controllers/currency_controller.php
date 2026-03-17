<?php
declare(strict_types=1);

require_once __DIR__ . '/../utils.php';

// NOTE: For a real system, fetch rates from a reliable API.
// Here we provide a small offline-safe rate table as fallback.
function currency_convert(): void {
  $amount = isset($_GET['amount']) ? (float)$_GET['amount'] : 0.0;
  $to = strtoupper(trim((string)($_GET['to'] ?? 'USD')));
  $from = strtoupper(trim((string)($_GET['from'] ?? 'USD')));

  $ratesToUSD = [
    'USD' => 1.0,
    'CAD' => 0.74,
    'EUR' => 1.08,
    'GBP' => 1.27,
    'NPR' => 0.0075,
    'INR' => 0.012,
  ];

  if (!isset($ratesToUSD[$from]) || !isset($ratesToUSD[$to])) {
    json_response(['error'=>'Unsupported currency'], 422);
  }

  // convert: from -> USD -> to
  $usd = $amount * $ratesToUSD[$from];
  $out = $usd / $ratesToUSD[$to];
  json_response([
    'ok'=>true,
    'from'=>$from,
    'to'=>$to,
    'amount'=>$amount,
    'converted'=>round($out, 2),
    'note'=>'Demo rates; replace with live API in production.'
  ]);
}
