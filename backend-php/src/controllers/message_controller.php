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

  $stmt = db()->prepare("SELECT agency_id, title FROM tours WHERE id = ? LIMIT 1");
  $stmt->execute([$tourId]);
  $tour = $stmt->fetch();
  if (!$tour) json_response(['error' => 'Tour not found'], 404);

  $senderId   = (int)($actor['uid'] ?? $actor['id'] ?? 0);
  $receiverId = (int)$tour['agency_id'];
  $senderRole = 'customer';

  if (($actor['role'] ?? '') === 'agency') {
    $receiverId = (int)($data['receiver_id'] ?? 0);
    if (!$receiverId) json_response(['error' => 'receiver_id required'], 422);
    $senderRole = 'agency';
  }

  // Save message
  $stmt = db()->prepare("
    INSERT INTO messages (tour_id, sender_id, receiver_id, sender_role, message)
    VALUES (?, ?, ?, ?, ?)
  ");
  $stmt->execute([$tourId, $senderId, $receiverId, $senderRole, $message]);

  // Sender name fetch
  $senderStmt = db()->prepare("SELECT full_name FROM users WHERE id = ? LIMIT 1");
  $senderStmt->execute([$senderId]);
  $sender = $senderStmt->fetch();
  $senderName = $sender['full_name'] ?? 'Someone';
  $tourTitle  = $tour['title'] ?? 'a tour';

  if ($senderRole === 'customer') {
    $notifTitle = "New message from {$senderName}";
    $notifBody  = "Re: {$tourTitle} — \"{$message}\"";
    $notifTo    = $receiverId;
  } else {
    $notifTitle = "Reply from your tour agency";
    $notifBody  = "Re: {$tourTitle} — \"{$message}\"";
    $notifTo    = $receiverId;
  }

  // In-app notification
  try {
    db()->prepare("
      INSERT INTO notifications (user_id, title, body, category, is_read, created_at)
      VALUES (?, ?, ?, 'message', 0, NOW())
    ")->execute([$notifTo, $notifTitle, $notifBody]);
  } catch (\Exception $e) {
    error_log('Notification failed: ' . $e->getMessage());
  }

  // email to customer if agency sent message
  if ($senderRole === 'agency') {
    try {
      $config = require __DIR__ . '/../config/config.php';
      $mail   = require __DIR__ . '/../config/mailer.php';

      $custStmt = db()->prepare("SELECT full_name, email FROM users WHERE id = ? LIMIT 1");
      $custStmt->execute([$notifTo]);
      $customer = $custStmt->fetch();

      if ($customer) {
        $mail->addAddress($customer['email'], $customer['full_name']);
        $mail->Subject = "New message from your tour agency — {$tourTitle}";
        $mail->isHTML(true);
        $mail->Body = "
          <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e0d; color: #f0ede8; border-radius: 16px; overflow: hidden;'>
            <div style='background: linear-gradient(135deg, #1a2e1a, #0f1e10); padding: 32px; text-align: center;'>
              <h1 style='font-size: 24px; color: #a8d96b; margin: 0;'>Safe Journey Planner</h1>
              <p style='color: rgba(240,237,232,0.6); margin: 8px 0 0;'>You have a new message!</p>
            </div>
            <div style='padding: 32px;'>
              <p style='font-size: 16px; margin: 0 0 16px;'>Hello <strong>{$customer['full_name']}</strong>,</p>
              <p style='color: rgba(240,237,232,0.7); line-height: 1.6;'>
                Your tour agency has replied to your message about <strong style='color: #a8d96b;'>{$tourTitle}</strong>.
              </p>
              <div style='background: rgba(168,217,107,0.08); border: 1px solid rgba(168,217,107,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;'>
                <p style='color: rgba(240,237,232,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;'>Message from Agency</p>
                <p style='color: #fff; font-size: 15px; margin: 0; line-height: 1.6;'>{$message}</p>
              </div>
              <div style='background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <p style='color: #60a5fa; margin: 0; font-size: 14px;'>
                  Login to Safe Journey Planner to reply to this message.
                </p>
              </div>
            </div>
            <div style='background: rgba(255,255,255,0.03); padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);'>
              <p style='color: rgba(240,237,232,0.3); font-size: 12px; margin: 0;'>Safe Journey Planner &copy; 2025 &middot; Nepal</p>
            </div>
          </div>
        ";
        $mail->send();
      }
    } catch (\Exception $e) {
      error_log('Message email failed: ' . $e->getMessage());
    }
  }

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

