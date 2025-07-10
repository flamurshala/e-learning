<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

include 'db.php';

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;
if (!$course_id) {
    echo json_encode(['error' => 'Missing course_id']);
    exit;
}

// Count total sessions
$stmtTotal = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ?");
$stmtTotal->execute([$course_id]);
$totalSessions = (int)$stmtTotal->fetchColumn();

// Count submitted sessions
$stmtSubmitted = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ? AND submitted_at IS NOT NULL");
$stmtSubmitted->execute([$course_id]);
$submittedSessions = (int)$stmtSubmitted->fetchColumn();

$canComplete = ($submittedSessions >= $totalSessions - 2);

echo json_encode(['canComplete' => $canComplete]);
