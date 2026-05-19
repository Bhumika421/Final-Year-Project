<?php
declare(strict_types=1);

function upload_images(): void {
    $uploadDir = __DIR__ . '/../../public/uploads/';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    if (empty($_FILES['images'])) {
        json_response(['error' => 'No images uploaded'], 422);
        return;
    }

    $files   = $_FILES['images'];
    $urls    = [];
    $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/jfif'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    // Build base URL from current request
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
    $baseUrl   = $protocol . '://' . $host . $scriptDir;

    $count = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $count; $i++) {
        $name  = is_array($files['name'])     ? $files['name'][$i]     : $files['name'];
        $tmp   = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $type  = is_array($files['type'])     ? $files['type'][$i]     : $files['type'];
        $size  = is_array($files['size'])     ? $files['size'][$i]     : $files['size'];
        $error = is_array($files['error'])    ? $files['error'][$i]    : $files['error'];

        if ($error !== UPLOAD_ERR_OK) continue;

        // Check mime type via finfo for security
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $realType = finfo_file($finfo, $tmp);
        finfo_close($finfo);

        if (!in_array($realType, $allowed, true)) {
            json_response(['error' => 'Only JPG, PNG, WEBP, GIF allowed'], 422);
            return;
        }

        if ($size > $maxSize) {
            json_response(['error' => 'Each image must be under 5MB'], 422);
            return;
        }

        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if ($ext === 'jfif') $ext = 'jpg';
        $filename = uniqid('tour_', true) . '.' . $ext;
        $dest     = $uploadDir . $filename;

        if (move_uploaded_file($tmp, $dest)) {
            $urls[] = $baseUrl . '/uploads/' . $filename;
        }
    }

    if (empty($urls)) {
        json_response(['error' => 'Failed to upload images'], 500);
        return;
    }

    json_response(['ok' => true, 'urls' => $urls]);
}