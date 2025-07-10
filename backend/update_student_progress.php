<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$student_id = $data['student_id'] ?? null;
$course_id = $data['course_id'] ?? null;
$progress = $data['progress_percent'] ?? null;

if (!$student_id || !$course_id || $progress === null) {
  echo json_encode(['success' => false, 'error' => 'Missing fields']);
  exit;
}

try {
  $stmt = $conn->prepare("
    INSERT INTO student_progress (student_id, course_id, progress_percent)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE progress_percent = VALUES(progress_percent)
  ");
  $stmt->execute([$student_id, $course_id, $progress]);
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
