<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../utils.php';

// Customer: send message to agency
function messages_send(array $actor): void {
  $data = read_json_body();
  $tourId  = (int)($data['tour_id'] ?? 0);
  $message = trim((string)($data['message'] ?? ''));

  if (!$tourId || !$message) json_response(['error' => 'tour_id and message required'], 422);

  // Get agency_id from tour
  $stmt = db()->prepare("SELECT agency_id FROM tours WHERE id = ? LIMIT 1");
  $stmt->execute([$tourId]);
  $tour = $stmt->fetch();
  if (!$tour) json_response(['error' => 'Tour not found'], 404);

  $senderId   = (int)($actor['uid'] ?? $actor['id'] ?? 0);
  $receiverId = (int)$tour['agency_id'];
  $senderRole = 'customer';

  // If agency is sending
  if (($actor['role'] ?? '') === 'agency') {
    $receiverId = (int)($data['receiver_id'] ?? 0);
    if (!$receiverId) json_response(['error' => 'receiver_id required'], 422);
    $senderRole = 'agency';
  }

  $stmt = db()->prepare("
    INSERT INTO messages (tour_id, sender_id, receiver_id, sender_role, message)
    VALUES (?, ?, ?, ?, ?)
  ");
  $stmt->execute([$tourId, $senderId, $receiverId, $senderRole, $message]);

  json_response(['ok' => true, 'id' => (int)db()->lastInsertId()]);
}

// Get conversation for a tour
function messages_get_conversation(array $actor): void {
  $tourId     = (int)($_GET['tour_id'] ?? 0);
  $customerId = (int)($_GET['customer_id'] ?? 0);
  if (!$tourId) json_response(['error' => 'tour_id required'], 422);

  $uid  = (int)($actor['uid'] ?? $actor['id'] ?? 0);
  $role = $actor['role'] ?? '';

  if ($role === 'customer') {
    $stmt = db()->prepare("
      SELECT m.*,
        s.full_name as sender_name,
        r.full_name as receiver_name
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE m.tour_id = ?
        AND (m.sender_id = ? OR m.receiver_id = ?)
      ORDER BY m.created_at ASC
    ");
    $stmt->execute([$tourId, $uid, $uid]);
  } else {
    // Agency sees conversation with specific customer
    if (!$customerId) json_response(['error' => 'customer_id required'], 422);
    $agencyId = $uid;
    $stmt = db()->prepare("
      SELECT m.*,
        s.full_name as sender_name,
        r.full_name as receiver_name
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE m.tour_id = ?
        AND (
          (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
        )
      ORDER BY m.created_at ASC
    ");
    $stmt->execute([$tourId, $customerId, $agencyId, $agencyId, $customerId]);
  }

  $messages = $stmt->fetchAll();

  // Mark as read
  db()->prepare("
    UPDATE messages SET is_read = 1
    WHERE tour_id = ? AND receiver_id = ? AND is_read = 0
  ")->execute([$tourId, $uid]);

  json_response(['ok' => true, 'messages' => $messages]);
}

// Get all conversations for agency
function messages_get_threads(array $actor): void {
  $uid = (int)($actor['uid'] ?? $actor['id'] ?? 0);

  $stmt = db()->prepare("
    SELECT
      m.tour_id,
      t.title as tour_title,
      t.destination,
      CASE WHEN m.sender_role = 'customer' THEN m.sender_id ELSE m.receiver_id END as customer_id,
      u.full_name as customer_name,
      MAX(m.created_at) as last_message_at,
      (
        SELECT message FROM messages
        WHERE tour_id = m.tour_id
        ORDER BY created_at DESC LIMIT 1
      ) as last_message,
      SUM(CASE WHEN m.is_read = 0 AND m.receiver_id = ? THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    JOIN tours t ON t.id = m.tour_id
    JOIN users u ON u.id = CASE WHEN m.sender_role = 'customer' THEN m.sender_id ELSE m.receiver_id END
    WHERE t.agency_id = ?
    GROUP BY m.tour_id, customer_id
    ORDER BY last_message_at DESC
  ");
  $stmt->execute([$uid, $uid]);
  json_response(['ok' => true, 'threads' => $stmt->fetchAll()]);
}

// Unread count
function messages_unread_count(array $actor): void {
  $uid = (int)($actor['uid'] ?? $actor['id'] ?? 0);
  $stmt = db()->prepare("SELECT COUNT(*) c FROM messages WHERE receiver_id = ? AND is_read = 0");
  $stmt->execute([$uid]);
  json_response(['ok' => true, 'count' => (int)($stmt->fetch()['c'] ?? 0)]);
}