<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents('php://input'), true);

$professor_name = isset($data['name']) ? trim($data['name']) : '';
$professor_username = isset($data['username']) ? trim($data['username']) : ''; // NEW
$professor_email = isset($data['email']) ? trim($data['email']) : '';
$professor_password = isset($data['password']) ? $data['password'] : '';

if (!$professor_name || !$professor_username || !$professor_email || !$professor_password) {
    echo json_encode(['error' => 'Name, username, email and password are required']);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO professors (name, username, email, password) VALUES (?, ?, ?, ?)");
    $stmt->execute([$professor_name, $professor_username, $professor_email, $professor_password]);
    $professor_id = $conn->lastInsertId();

    echo json_encode(['success' => true, 'message' => 'Professor added successfully', 'professor_id' => $professor_id]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
