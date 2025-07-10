<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$course_id) {
    echo json_encode(["error" => "Missing course_id"]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT id, session_number, session_date 
        FROM training_sessions 
        WHERE course_id = ?
        ORDER BY session_number ASC
    ");
    $stmt->execute([$course_id]);
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($sessions);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
