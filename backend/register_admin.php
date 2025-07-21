<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents('php://input'), true);

$admin_name = isset($data['username']) ? trim($data['username']) : '';
$admin_email = isset($data['email']) ? trim($data['email']) : '';
$admin_password = isset($data['password']) ? $data['password'] : '';
$admin_role = isset($data['role']) ? trim($data['role']) : '';

if (!$admin_name || !$admin_email || !$admin_password || !$admin_role) {
    echo json_encode(['error' => 'Username, email, password, and role are required']);
    exit;
}

try {
    $hashed_password = password_hash($admin_password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$admin_name, $admin_email, $hashed_password, $admin_role]);
    $admin_id = $conn->lastInsertId();

    echo json_encode(['success' => true, 'message' => 'Admin user added successfully', 'admin_id' => $admin_id]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
