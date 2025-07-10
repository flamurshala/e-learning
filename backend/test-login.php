<?php
include "db.php";

// Hardcoded test credentials
$email = "mergim@gmail.com"; // CHANGE THIS to match your DB
$password = "123";                // Password you're trying to verify

$stmt = $conn->prepare("SELECT * FROM professors WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "❌ Email not found";
    exit;
}

if (password_verify($password, $user['password'])) {
    echo "✅ Password is correct";
} else {
    echo "❌ Password is incorrect";
}
