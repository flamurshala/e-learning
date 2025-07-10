<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $conn->prepare("SELECT * FROM students WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && $user['password'] === $password) {
    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email']
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
}
?>
