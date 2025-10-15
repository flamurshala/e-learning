<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include 'db.php';

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$course_id) {
    echo json_encode(['error' => 'Missing course_id']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            s.id,
            s.name,
            s.surname,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name
        FROM course_student cs
        INNER JOIN students s ON s.id = cs.student_id
        WHERE cs.course_id = ?
        ORDER BY s.name ASC, s.surname ASC
    ");
    $stmt->execute([$course_id]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    echo json_encode($rows);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
