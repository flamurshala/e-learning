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
    $sql = "
        SELECT DISTINCT
            s.id AS student_id,
            s.name,
            s.surname,
            -- Ready-to-use full name (also aliased as student_name for compatibility)
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS full_name,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name
        FROM students s
        INNER JOIN course_student cs ON cs.student_id = s.id
        WHERE cs.course_id = ?
        ORDER BY s.name ASC, s.surname ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$course_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($students ?: []);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
