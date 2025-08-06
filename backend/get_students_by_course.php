<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php';

$course_id = $_GET['course_id'] ?? null;

if (!$course_id) {
    echo json_encode(['error' => 'Missing course_id']);
    exit;
}

$stmt = $conn->prepare("
    SELECT s.id, s.name 
    FROM students s
    INNER JOIN course_student cs ON s.id = cs.student_id
    WHERE cs.course_id = ?
");
$stmt->execute([$course_id]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
