<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'db.php';

try {
    // Count total notifications
    $stmt = $conn->query("SELECT COUNT(*) as count FROM admin_notifications");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "count" => (int) ($row['count'] ?? 0)
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "error" => "Failed to get notification count",
        "details" => $e->getMessage()
    ]);
}
