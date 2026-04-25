<?php
declare(strict_types=1);

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $config = require __DIR__ . '/config/config.php';
  $db = $config['db'];
  $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $db['host'], $db['name'], $db['charset']);

  $pdo = new PDO($dsn, $db['user'], $db['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);

  ensure_schema_compatibility($pdo);

  return $pdo;
}

function ensure_schema_compatibility(PDO $pdo): void {
  static $checked = false;
  if ($checked) return;
  $checked = true;

  // Keep older databases compatible with newer tours workflow fields.
  ensure_table_column($pdo, 'tours', 'images_json', "ALTER TABLE tours ADD COLUMN images_json TEXT NULL AFTER image_url");
  ensure_table_column($pdo, 'tours', 'approved_by', "ALTER TABLE tours ADD COLUMN approved_by INT NULL AFTER approval_status");
  ensure_table_column($pdo, 'tours', 'approved_at', "ALTER TABLE tours ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL AFTER approved_by");
  ensure_table_column($pdo, 'tours', 'rejection_reason', "ALTER TABLE tours ADD COLUMN rejection_reason VARCHAR(255) NULL AFTER approved_at");

  // Bookings compatibility fields.
  ensure_table_column($pdo, 'bookings', 'booking_code', "ALTER TABLE bookings ADD COLUMN booking_code VARCHAR(20) NULL UNIQUE AFTER id");
  ensure_table_column($pdo, 'bookings', 'travelers_json', "ALTER TABLE bookings ADD COLUMN travelers_json LONGTEXT NULL AFTER travel_date");
  ensure_table_column($pdo, 'bookings', 'subtotal_usd', "ALTER TABLE bookings ADD COLUMN subtotal_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER travelers_json");
  ensure_table_column($pdo, 'bookings', 'tax_usd', "ALTER TABLE bookings ADD COLUMN tax_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER subtotal_usd");
  ensure_table_column($pdo, 'bookings', 'discount_usd', "ALTER TABLE bookings ADD COLUMN discount_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER tax_usd");
  ensure_table_column($pdo, 'bookings', 'total_usd', "ALTER TABLE bookings ADD COLUMN total_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_usd");

  // Payments compatibility fields.
  ensure_table_column($pdo, 'payments', 'currency', "ALTER TABLE payments ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER amount_usd");
  ensure_table_column($pdo, 'payments', 'provider_ref', "ALTER TABLE payments ADD COLUMN provider_ref VARCHAR(100) NULL UNIQUE AFTER currency");
  ensure_table_column($pdo, 'payments', 'provider_order_id', "ALTER TABLE payments ADD COLUMN provider_order_id VARCHAR(100) NULL AFTER provider_ref");
  ensure_table_column($pdo, 'payments', 'provider_capture_id', "ALTER TABLE payments ADD COLUMN provider_capture_id VARCHAR(100) NULL AFTER provider_order_id");
  ensure_table_column($pdo, 'payments', 'provider_payload_json', "ALTER TABLE payments ADD COLUMN provider_payload_json LONGTEXT NULL AFTER provider_capture_id");
  ensure_table_column($pdo, 'payments', 'idempotency_key', "ALTER TABLE payments ADD COLUMN idempotency_key VARCHAR(120) NULL AFTER provider_payload_json");
  ensure_table_column($pdo, 'payments', 'updated_at', "ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER status");

  // Notifications richer payload fields.
  ensure_table_column($pdo, 'notifications', 'category', "ALTER TABLE notifications ADD COLUMN category VARCHAR(60) NOT NULL DEFAULT 'general' AFTER user_id");
  ensure_table_column($pdo, 'notifications', 'title', "ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NULL AFTER category");
  ensure_table_column($pdo, 'notifications', 'body', "ALTER TABLE notifications ADD COLUMN body TEXT NULL AFTER title");
  ensure_table_column($pdo, 'notifications', 'expires_at', "ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP NULL DEFAULT NULL AFTER body");

  // Support ticket compatibility fields.
  ensure_table_column($pdo, 'support_tickets', 'ticket_code', "ALTER TABLE support_tickets ADD COLUMN ticket_code VARCHAR(20) NULL UNIQUE AFTER id");
  ensure_table_column($pdo, 'support_tickets', 'name', "ALTER TABLE support_tickets ADD COLUMN name VARCHAR(160) NULL AFTER user_id");
  ensure_table_column($pdo, 'support_tickets', 'email', "ALTER TABLE support_tickets ADD COLUMN email VARCHAR(190) NULL AFTER name");
  ensure_table_column($pdo, 'support_tickets', 'category', "ALTER TABLE support_tickets ADD COLUMN category VARCHAR(80) NULL AFTER email");
  ensure_table_column($pdo, 'support_tickets', 'admin_reply', "ALTER TABLE support_tickets ADD COLUMN admin_reply TEXT NULL AFTER message");

  // Loyalty points for payment rewards.
  ensure_table_column($pdo, 'users', 'loyalty_points', "ALTER TABLE users ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0 AFTER is_active");

  // Keep enums and nullability aligned with controller behavior.
  ensure_column_nullable($pdo, 'support_tickets', 'user_id', 'INT NULL');
  ensure_enum_contains($pdo, 'support_tickets', 'status', ['open', 'answered', 'closed'], 'open');
  ensure_enum_contains($pdo, 'bookings', 'status', ['pending', 'confirmed', 'paid', 'cancelled'], 'pending');
  ensure_enum_contains($pdo, 'payments', 'method', ['khalti', 'esewa', 'card', 'paypal'], 'card');
  ensure_enum_contains($pdo, 'payments', 'status', ['initiated', 'pending_verification', 'paid', 'failed'], 'initiated');

  // Payment indexes/constraints for idempotency and replay protection.
  ensure_table_index($pdo, 'payments', 'idx_payments_booking_status', "ALTER TABLE payments ADD INDEX idx_payments_booking_status (booking_id, status)");
  ensure_table_index($pdo, 'payments', 'idx_payments_idempotency', "ALTER TABLE payments ADD INDEX idx_payments_idempotency (booking_id, idempotency_key, status)");
  ensure_table_index($pdo, 'payments', 'uq_payments_method_provider_order', "ALTER TABLE payments ADD UNIQUE KEY uq_payments_method_provider_order (method, provider_order_id)");
}

function ensure_table_column(PDO $pdo, string $table, string $column, string $alterSql): void {
  $tableSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
  $columnSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $column);
  if ($tableSafe === '' || $columnSafe === '') return;

  $stmt = $pdo->query("SHOW COLUMNS FROM {$tableSafe} LIKE '{$columnSafe}'");
  if (!$stmt->fetch()) {
    $pdo->exec($alterSql);
  }
}

function ensure_column_nullable(PDO $pdo, string $table, string $column, string $columnTypeSql): void {
  $tableSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
  $columnSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $column);
  if ($tableSafe === '' || $columnSafe === '') return;

  $stmt = $pdo->prepare(
    'SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
  );
  $stmt->execute([$tableSafe, $columnSafe]);
  $row = $stmt->fetch();
  if (!$row) return;
  if (($row['IS_NULLABLE'] ?? 'NO') === 'YES') return;

  $pdo->exec("ALTER TABLE {$tableSafe} MODIFY COLUMN {$columnSafe} {$columnTypeSql}");
}

function ensure_table_index(PDO $pdo, string $table, string $index, string $alterSql): void {
  $tableSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
  $indexSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $index);
  if ($tableSafe === '' || $indexSafe === '') return;

  $stmt = $pdo->prepare(
    'SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1'
  );
  $stmt->execute([$tableSafe, $indexSafe]);
  if ($stmt->fetch()) return;

  $pdo->exec($alterSql);
}

function ensure_enum_contains(PDO $pdo, string $table, string $column, array $values, string $default): void {
  $tableSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
  $columnSafe = preg_replace('/[^a-zA-Z0-9_]/', '', $column);
  if ($tableSafe === '' || $columnSafe === '' || !$values) return;

  $stmt = $pdo->prepare(
    'SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
  );
  $stmt->execute([$tableSafe, $columnSafe]);
  $row = $stmt->fetch();
  if (!$row) return;

  $columnType = (string)($row['COLUMN_TYPE'] ?? '');
  $missing = false;
  foreach ($values as $value) {
    if (strpos($columnType, "'{$value}'") === false) {
      $missing = true;
      break;
    }
  }
  if (!$missing) return;

  $escapedValues = array_map(static fn(string $v): string => "'" . str_replace("'", "''", $v) . "'", $values);
  $defaultSafe = str_replace("'", "''", $default);
  $enumSql = implode(',', $escapedValues);
  $pdo->exec("ALTER TABLE {$tableSafe} MODIFY COLUMN {$columnSafe} ENUM({$enumSql}) NOT NULL DEFAULT '{$defaultSafe}'");
}
