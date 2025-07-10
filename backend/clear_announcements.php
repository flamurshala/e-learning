<?php
header('Access-Control-Allow-Origin: *');
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"] ?? null;
$user_type = $data["user_type"] ?? null;
$audience = $data["audience"] ?? null; // add audience to know which announcements

if (!$user_id || !$user_type || !$audience) {
    echo json_encode(["success" => false, "error" => "Missing user_id, user_type or audience"]);
    exit;
}

try {
    // Fetch all announcement IDs for the audience
    $stmt = $conn->prepare("SELECT id FROM announcements WHERE audience = ?");
    $stmt->execute([$audience]);
    $announcements = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Insert each announcement_id for the user into user_announcements
    $insertStmt = $conn->prepare("
        INSERT IGNORE INTO user_announcements (user_id, user_type, announcement_id)
        VALUES (?, ?, ?)
    ");

    foreach ($announcements as $announcement_id) {
        $insertStmt->execute([$user_id, $user_type, $announcement_id]);
    }

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
