<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php';

try {
    $stmt = $conn->query("SELECT id, message, created_at FROM admin_notifications ORDER BY created_at DESC");
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($notifications);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
