<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php';

$professor_id = isset($_GET['professor_id']) ? (int)$_GET['professor_id'] : 0;

if (!$professor_id) {
    echo json_encode(['error' => 'Professor ID is required']);
    exit;
}

try {
    $stmt = $conn->prepare("
    SELECT c.id, c.title, c.description
    FROM course_professor cs
    JOIN courses c ON cs.course_id = c.id
    WHERE cs.professor_id = ?
");
    $stmt->execute([$professor_id]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($courses);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
