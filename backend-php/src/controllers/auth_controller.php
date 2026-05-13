<?php
declare(strict_types=1);
date_default_timezone_set('Asia/Kathmandu'); 

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

function auth_register(): void {
  $data = read_json_body();
  require_fields($data, ['full_name','email','password','confirm_password']);

  $full = trim((string)$data['full_name']);
  $email = strtolower(trim((string)$data['email']));
  $pass = (string)$data['password'];
  $confirm = (string)$data['confirm_password'];

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error'=>'Invalid email'], 422);
  if ($pass !== $confirm) json_response(['error'=>'Passwords do not match'], 422);
  if (strlen($pass) < 8 || !preg_match('/[A-Z]/',$pass) || !preg_match('/[a-z]/',$pass) || !preg_match('/\d/',$pass) || !preg_match('/[^A-Za-z0-9]/',$pass)) {
    json_response(['error'=>'Weak password. Use 8+ chars with upper, lower, number, special.'], 422);
  }

  $stmt = db()->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
  $stmt->execute([$email]);
  if ($stmt->fetch()) json_response(['error'=>'Email already registered'], 409);

  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $stmt = db()->prepare('INSERT INTO users (full_name, email, password_hash, role, verification_status) VALUES (?,?,?,?,?)');
  $stmt->execute([$full, $email, $hash, 'customer', 'verified']);

  app_log('register_success', ['email'=>$email]);
  json_response(['ok'=>true, 'message'=>'Registered successfully.']);
}

function auth_register_agency(): void {
  $data = read_json_body();
  require_fields($data, ['full_name','email','password','confirm_password','business_name','license_no']);

  $full = trim((string)$data['full_name']);
  $email = strtolower(trim((string)$data['email']));
  $business = trim((string)$data['business_name']);
  $license = trim((string)$data['license_no']);
  $pass = (string)$data['password'];
  $confirm = (string)$data['confirm_password'];

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error'=>'Invalid email'], 422);
  if ($pass !== $confirm) json_response(['error'=>'Passwords do not match'], 422);
  if ($business === '' || $license === '') json_response(['error'=>'Missing agency verification fields'], 422);

  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $stmt = db()->prepare('INSERT INTO users (full_name, email, password_hash, role, verification_status, business_name, license_no) VALUES (?,?,?,?,?,?,?)');
  try {
    $stmt->execute([$full, $email, $hash, 'agency', 'pending', $business, $license]);
  } catch (PDOException $e) {
    if ((int)$e->getCode() === 23000) json_response(['error'=>'Email already exists'], 409);
    throw $e;
  }
  json_response(['ok'=>true,'message'=>'Agency registered. Your account will be activated after admin verification.']);
}

function auth_register_admin(): void {
  $data = read_json_body();
  require_fields($data, ['full_name','email','password','confirm_password','setup_code']);

  $config = require __DIR__ . '/../config/config.php';
  $setupCode = (string)$config['app']['admin_setup_code'];
  if ((string)$data['setup_code'] !== $setupCode) {
    json_response(['error'=>'Invalid setup code'], 403);
  }

  $stmt = db()->query("SELECT COUNT(*) c FROM users WHERE role='admin'");
  $count = (int)($stmt->fetch()['c'] ?? 0);
  if ($count > 0) json_response(['error'=>'Admin account already exists'], 409);

  $full = trim((string)$data['full_name']);
  $email = strtolower(trim((string)$data['email']));
  $pass = (string)$data['password'];
  $confirm = (string)$data['confirm_password'];
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error'=>'Invalid email'], 422);
  if ($pass !== $confirm) json_response(['error'=>'Passwords do not match'], 422);

  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $stmt = db()->prepare('INSERT INTO users (full_name, email, password_hash, role, verification_status) VALUES (?,?,?,?,?)');
  $stmt->execute([$full, $email, $hash, 'admin', 'verified']);
  json_response(['ok'=>true,'message'=>'Admin account created.']);
}

function auth_login(): void {
  $data = read_json_body();

  $identifier = '';
  if (isset($data['identifier'])) $identifier = (string)$data['identifier'];
  elseif (isset($data['email'])) $identifier = (string)$data['email'];

  $identifier = strtolower(trim($identifier));
  $pass = (string)($data['password'] ?? '');

  if ($identifier === '' || $pass === '') {
    json_response(['error' => 'Missing login fields'], 422);
  }

  $loginAs = strtolower(trim((string)($data['login_as'] ?? 'customer')));
  if (!in_array($loginAs, ['customer','agency','admin'], true)) {
    json_response(['error' => 'Invalid login_as'], 422);
  }

  $stmt = db()->prepare('SELECT id, full_name, email, password_hash, role, is_active, verification_status, business_name FROM users WHERE email=? LIMIT 1');
  $stmt->execute([$identifier]);
  $user = $stmt->fetch();

  if (!$user) {
    json_response(['error'=>'No account found. Please sign up first.'], 401);
  }

  if ((int)$user['is_active'] !== 1) json_response(['error'=>'Account inactive'], 403);

  if (!password_verify($pass, (string)$user['password_hash'])) {
    json_response(['error'=>'Invalid credentials'], 401);
  }

  if ($loginAs === 'admin' && (string)$user['role'] !== 'admin') {
    json_response(['error' => 'Please use Admin Login for admin accounts.'], 403);
  }
  if ($loginAs === 'agency' && (string)$user['role'] !== 'agency') {
    json_response(['error' => 'Please use Agency Login for agency accounts.'], 403);
  }
  if ($loginAs === 'customer' && (string)$user['role'] !== 'customer') {
    json_response(['error' => 'Please use Customer Login for customer accounts.'], 403);
  }

  if ($loginAs === 'agency') {
    if ((string)($user['verification_status'] ?? 'pending') !== 'verified') {
      json_response(['error' => 'Agency account pending verification.'], 403);
    }
  }

  if ($loginAs === 'admin') {
    $config = require __DIR__ . '/../config/config.php';
    $requiredCode = (string)($config['app']['admin_login_code'] ?? '');
    $providedCode = (string)($data['admin_code'] ?? '');
    if ($requiredCode !== '' && !hash_equals($requiredCode, $providedCode)) {
      json_response(['error' => 'Invalid admin verification code'], 403);
    }
  }

  $config = require __DIR__ . '/../config/config.php';
  $ttl = (int)$config['app']['jwt_ttl_minutes'] * 60;
  $payload = [
    'uid'  => (int)$user['id'],
    'role' => (string)$user['role'],
    'iat'  => time(),
    'exp'  => time() + $ttl,
  ];
  $token = jwt_sign($payload, $config['app']['jwt_secret']);

  json_response([
    'ok'    => true,
    'token' => $token,
    'user'  => [
      'id'                  => (int)$user['id'],
      'full_name'           => (string)$user['full_name'],
      'email'               => (string)$user['email'],
      'role'                => (string)$user['role'],
      'verification_status' => (string)($user['verification_status'] ?? 'verified'),
      'business_name'       => $user['business_name'] ?? null,
    ]
  ]);
}

function auth_update(array $currentUser): void {
  $data = read_json_body();
  $uid = (int)($currentUser['uid'] ?? $currentUser['id']);

  $updates = [];
  $params = [];

  if (!empty($data['full_name'])) {
    $updates[] = 'full_name = ?';
    $params[] = trim((string)$data['full_name']);
  }

  if (!empty($data['new_password'])) {
    $current_pass = (string)($data['current_password'] ?? '');
    if ($current_pass === '') json_response(['error' => 'Current password required'], 422);

    $stmt = db()->prepare('SELECT password_hash FROM users WHERE id=? LIMIT 1');
    $stmt->execute([$uid]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($current_pass, (string)$row['password_hash'])) {
      json_response(['error' => 'Current password is incorrect'], 401);
    }

    $new_pass = (string)$data['new_password'];
    if (strlen($new_pass) < 8 || !preg_match('/[A-Z]/',$new_pass) || !preg_match('/[a-z]/',$new_pass) || !preg_match('/\d/',$new_pass) || !preg_match('/[^A-Za-z0-9]/',$new_pass)) {
      json_response(['error' => 'Weak password. Use 8+ chars with upper, lower, number, special.'], 422);
    }

    $updates[] = 'password_hash = ?';
    $params[] = password_hash($new_pass, PASSWORD_BCRYPT);
  }

  if (empty($updates)) json_response(['error' => 'Nothing to update'], 422);

  $params[] = $uid;
  $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id=?';
  db()->prepare($sql)->execute($params);

  $stmt = db()->prepare('SELECT id, full_name, email, role, verification_status, business_name FROM users WHERE id=? LIMIT 1');
  $stmt->execute([$uid]);
  $user = $stmt->fetch();

  json_response([
    'ok' => true,
    'message' => 'Profile updated successfully.',
    'user' => [
      'id'                  => (int)$user['id'],
      'full_name'           => (string)$user['full_name'],
      'email'               => (string)$user['email'],
      'role'                => (string)$user['role'],
      'verification_status' => (string)($user['verification_status'] ?? 'verified'),
      'business_name'       => $user['business_name'] ?? null,
    ]
  ]);
}

function auth_me(array $currentUser): void {
  json_response(['ok'=>true, 'user'=>$currentUser]);
}

function auth_google_login(): void {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $userInfo = $body['user_info'] ?? null;

    if (!$userInfo || empty($userInfo['sub'])) {
        json_response(['success' => false, 'message' => 'Invalid Google user info'], 400);
        return;
    }

    $googleId = $userInfo['sub'];
    $email    = $userInfo['email'] ?? '';
    $fullName = $userInfo['name'] ?? '';
    $avatar   = $userInfo['picture'] ?? '';

    if (!$email) {
        json_response(['success' => false, 'message' => 'Email not provided by Google'], 400);
        return;
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR google_id = ?");
    $stmt->execute([$email, $googleId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $stmt = $pdo->prepare("
            INSERT INTO users (full_name, email, google_id, avatar, role, verification_status, created_at)
            VALUES (?, ?, ?, ?, 'customer', 'verified', NOW())
        ");
        $stmt->execute([$fullName, $email, $googleId, $avatar]);
        $userId = $pdo->lastInsertId();
        $user = [
            'id'        => $userId,
            'full_name' => $fullName,
            'email'     => $email,
            'role'      => 'customer',
        ];
    } else {
        $pdo->prepare("
            UPDATE users SET
                google_id = COALESCE(google_id, ?),
                avatar    = COALESCE(avatar, ?),
                full_name = COALESCE(full_name, ?)
            WHERE id = ?
        ")->execute([$googleId, $avatar, $fullName, $user['id']]);

        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $config = require __DIR__ . '/../config/config.php';
    $ttl = (int)$config['app']['jwt_ttl_minutes'] * 60;
    $jwtPayload = [
        'uid'  => (int)$user['id'],
        'role' => (string)($user['role'] ?? 'customer'),
        'iat'  => time(),
        'exp'  => time() + $ttl,
    ];
    $token = jwt_sign($jwtPayload, $config['app']['jwt_secret']);

    json_response([
        'success' => true,
        'token'   => $token,
        'user'    => [
            'id'        => (int)$user['id'],
            'full_name' => $user['full_name'] ?? $fullName,
            'email'     => $user['email'],
            'role'      => $user['role'] ?? 'customer',
        ]
    ]);
}


function auth_forgot_password(): void {
    date_default_timezone_set('Asia/Kathmandu');
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = strtolower(trim((string)($body['email'] ?? '')));

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'Valid email required'], 422);
        return;
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id, full_name FROM users WHERE email = ? AND role = 'customer' LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['ok' => true, 'message' => 'If this email exists, an OTP has been sent.']);
        return;
    }

    // Generate 6-digit OTP
    $otp       = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', time() + 600); // 10 minutes

    // Delete old tokens
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    // Save OTP as token
    $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)")
        ->execute([$email, $otp, $expiresAt]);

    // Send email
    try {
        require_once __DIR__ . '/../../vendor/autoload.php';
        $config = require __DIR__ . '/../config/config.php';
        $mail   = new PHPMailer\PHPMailer\PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $config['mail']['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['mail']['username'];
        $mail->Password   = $config['mail']['password'];
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $config['mail']['port'];

        $mail->setFrom($config['mail']['from'], $config['mail']['from_name']);
        $mail->addAddress($email, $user['full_name']);
        $mail->Subject = 'Your OTP Code — Safe Journey Planner';
        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family: sans-serif; max-width: 480px; margin: auto; background:#131918; padding:32px; border-radius:16px;'>
                <h2 style='color:#a8d96b; margin-bottom:8px;'>Password Reset OTP</h2>
                <p style='color:#ccc;'>Hi {$user['full_name']},</p>
                <p style='color:#ccc;'>Your OTP code is:</p>
                <div style='background:#1e2a1a; border:2px solid #a8d96b; border-radius:12px; padding:24px; text-align:center; margin:20px 0;'>
                    <span style='font-size:42px; font-weight:700; letter-spacing:12px; color:#a8d96b;'>{$otp}</span>
                </div>
                <p style='color:#999; font-size:13px;'>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                <p style='color:#999; font-size:13px;'>If you didn't request this, ignore this email.</p>
            </div>
        ";
        $mail->send();
    } catch (Exception $e) {
        json_response(['error' => 'Failed to send OTP. Try again.'], 500);
        return;
    }

    json_response(['ok' => true, 'message' => 'OTP sent to your email!']);
}

function auth_verify_otp(): void {
    date_default_timezone_set('Asia/Kathmandu');
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $otp   = trim((string)($body['otp'] ?? ''));

    if (!$email || !$otp) {
        json_response(['error' => 'Email and OTP required'], 422);
        return;
    }

    $pdo = db();
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW() LIMIT 1");
    $stmt->execute([$email, $otp]);
    $reset = $stmt->fetch();

    if (!$reset) {
        json_response(['error' => 'Invalid or expired OTP.'], 400);
        return;
    }

    json_response(['ok' => true, 'message' => 'OTP verified!']);
}

function auth_reset_password(): void {
    date_default_timezone_set('Asia/Kathmandu');
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $email    = strtolower(trim((string)($body['email'] ?? '')));
    $otp      = trim((string)($body['otp'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $confirm  = (string)($body['confirm_password'] ?? '');

    if (!$email || !$otp || !$password) {
        json_response(['error' => 'All fields required'], 422);
        return;
    }

    if ($password !== $confirm) {
        json_response(['error' => 'Passwords do not match'], 422);
        return;
    }

    if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/\d/', $password) || !preg_match('/[^A-Za-z0-9]/', $password)) {
        json_response(['error' => 'Weak password. Use 8+ chars with upper, lower, number, special.'], 422);
        return;
    }

    $pdo = db();

    // Verify OTP again
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW() LIMIT 1");
    $stmt->execute([$email, $otp]);
    $reset = $stmt->fetch();

    if (!$reset) {
        json_response(['error' => 'Invalid or expired OTP.'], 400);
        return;
    }

    // Update password
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?")->execute([$hash, $email]);

    // Delete used OTP
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    json_response(['ok' => true, 'message' => 'Password reset successfully!']);
}