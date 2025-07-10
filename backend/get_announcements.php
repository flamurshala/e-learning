<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$audience = $_GET["audience"] ?? null;
$user_id = $_GET["user_id"] ?? null;

if (!$audience || !$user_id) {
    echo json_encode([]);
    exit;
}

try {
    $sql = "
        SELECT a.id, a.title, a.content, a.created_at 
        FROM announcements a
        WHERE a.audience = ?
          AND a.id NOT IN (
              SELECT announcement_id
              FROM user_announcements
              WHERE user_id = ? AND user_type = ?
          )
        ORDER BY a.created_at DESC
        LIMIT 25
    ";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$audience, $user_id, $audience === 'students' ? 'student' : 'professor']); 
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($announcements);
} catch (PDOException $e) {
    echo json_encode([]);
}
