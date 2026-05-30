<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/../../vendor/autoload.php';

$config = require __DIR__ . '/config.php';

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host       = $config['mail']['host'];
$mail->SMTPAuth   = true;
$mail->Username   = $config['mail']['username'];
$mail->Password   = $config['mail']['password'];
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port       = $config['mail']['port'];
$mail->setFrom($config['mail']['from_email'], $config['mail']['from_name']);
$mail->CharSet    = 'UTF-8';

return $mail;