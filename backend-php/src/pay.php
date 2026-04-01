<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// ============================
// CONFIGURE HERE
// ============================
$secret_key = "your-live-secret-key";       // Khalti dashboard bata
$sandbox_secret_key = "your-test-secret-key"; // Test ko lagi

$is_sandbox = true; // Testing ma true, production ma false
$active_key = $is_sandbox ? $sandbox_secret_key : $secret_key;
$base_url = $is_sandbox 
    ? "https://dev.khalti.com/api/v2/" 
    : "https://khalti.com/api/v2/";
// ============================

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

// 1. INITIATE PAYMENT
if ($action === 'initiate') {
    $amount      = $input['amount'] * 100; // paisa ma convert (Rs.10 = 1000 paisa)
    $productName = $input['product_name'] ?? 'Product';
    $productId   = $input['product_id'] ?? 'product-001';
    $returnUrl   = $input['return_url'] ?? 'http://localhost:3000/payment-success';
    $websiteUrl  = $input['website_url'] ?? 'http://localhost:3000';

    $data = [
        "return_url"   => $returnUrl,
        "website_url"  => $websiteUrl,
        "amount"       => $amount,
        "purchase_order_id"   => $productId,
        "purchase_order_name" => $productName,
    ];

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL            => $base_url . "epayment/initiate/",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_HTTPHEADER     => [
            "Authorization: Key $active_key",
            "Content-Type: application/json",
        ],
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    $parsed = json_decode($response, true);

    if (isset($parsed['payment_url'])) {
        echo json_encode([
            'success'     => true,
            'payment_url' => $parsed['payment_url'],
            'pidx'        => $parsed['pidx'],
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error'   => $parsed,
        ]);
    }
}

// 2. VERIFY PAYMENT
if ($action === 'verify') {
    $pidx = $input['pidx'] ?? '';

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL            => $base_url . "epayment/lookup/",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['pidx' => $pidx]),
        CURLOPT_HTTPHEADER     => [
            "Authorization: Key $active_key",
            "Content-Type: application/json",
        ],
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    $parsed = json_decode($response, true);

    if (isset($parsed['status']) && $parsed['status'] === 'Completed') {
        // ✅ Payment success - database update gara here
        echo json_encode([
            'success' => true,
            'status'  => $parsed['status'],
            'amount'  => $parsed['total_amount'] / 100, // Rs. ma convert
            'data'    => $parsed,
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'status'  => $parsed['status'] ?? 'Unknown',
            'data'    => $parsed,
        ]);
    }
}
?>