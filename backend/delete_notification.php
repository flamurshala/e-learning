<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);
$notification_id = isset($data['id']) ? (int)$data['id'] : 0;

if ($notification_id <= 0) {
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}

try {
    $stmt = $conn->prepare("DELETE FROM admin_notifications WHERE id = ?");
    $stmt->execute([$notification_id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
