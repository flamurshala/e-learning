<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$professor_id = isset($data['id']) ? (int)$data['id'] : 0;
$name     = trim($data['name'] ?? '');
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$professor_id || $name === '' || $username === '' || $email === '' || $password === '') {
    echo json_encode([
        "success" => false,
        "error"   => "Missing data"
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        UPDATE professors
           SET name = ?, username = ?, email = ?, password = ?
         WHERE id = ?
    ");
    $stmt->execute([$name, $username, $email, $password, $professor_id]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    // Handle uniqueness violations (e.g., duplicate username/email) more nicely
    if ($e->getCode() === '23000') {
        echo json_encode([
            "success" => false,
            "error"   => "Username or email already exists"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error"   => $e->getMessage()
        ]);
    }
}
