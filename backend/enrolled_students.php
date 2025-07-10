<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php';

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$course_id) {
    echo json_encode(['error' => 'Course ID is required']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT s.id AS student_id, s.name FROM students s
    JOIN course_student cs ON cs.student_id = s.id
    WHERE cs.course_id = ?");
    $stmt->execute([$course_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($students);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
