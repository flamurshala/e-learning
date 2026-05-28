<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

// Changed from 'email' to 'username'
$username = isset($data['username']) ? trim($data['username']) : '';
$password = $data['password'] ?? '';

if ($username === '') {
    echo json_encode([
        "success" => false,
        "message" => "Username or code is required"
    ]);
    exit;
}

if (preg_match('/^\d{4}$/', $username)) {
    $stmt = $conn->prepare("SELECT * FROM admins WHERE username = ? AND role = 'administrata' LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "email" => $user['email'],
                "role" => $user['role']
            ]
        ]);
        exit;
    }

    echo json_encode([
        "success" => false,
        "message" => "Invalid administrata code"
    ]);
    exit;
}

if ($password === '') {
    echo json_encode([
        "success" => false,
        "message" => "Password is required"
    ]);
    exit;
}

// Lookup by username now
$stmt = $conn->prepare("SELECT * FROM admins WHERE username = ? AND role <> 'administrata'");
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
