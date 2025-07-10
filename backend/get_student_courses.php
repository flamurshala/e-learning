<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'db.php';

$student_id = isset($_GET['student_id']) ? (int) $_GET['student_id'] : 0;

if (!$student_id) {
    echo json_encode(['error' => 'Student ID is required']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT c.id, c.title, c.description, p.name AS professor_name
        FROM courses c
        JOIN professors p ON c.professor_id = p.id
        JOIN course_student cs ON c.id = cs.course_id
        WHERE cs.student_id = ?
    ");
    $stmt->execute([$student_id]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($courses);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
