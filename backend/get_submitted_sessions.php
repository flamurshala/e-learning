<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

$professorId = $_GET['professor_id'] ?? null;
$courseId = $_GET['course_id'] ?? null;

if (!$professorId || !$courseId) {
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

// Check if professor is assigned to the course (optional security check)
// You can skip this block if not needed
$stmtCheck = $conn->prepare("SELECT COUNT(*) FROM course_professor WHERE professor_id = ? AND course_id = ?");
$stmtCheck->execute([$professorId, $courseId]);
if ($stmtCheck->fetchColumn() == 0) {
    echo json_encode([]);
    exit;
}

// Get submitted session IDs
$stmt = $conn->prepare("SELECT id AS session_id FROM training_sessions WHERE course_id = ? AND submitted_at IS NOT NULL");
$stmt->execute([$courseId]);
$sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($sessions);
