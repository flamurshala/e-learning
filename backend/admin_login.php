<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

// Changed from 'email' to 'username'
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Lookup by username now
$stmt = $conn->prepare("SELECT * FROM admins WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "email" => $user['email'],
            "role" => $user['role']
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid username or password"
    ]);
}
?>
