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
        SELECT
            c.id,
            c.title,
            c.description,
            COALESCE(
                NULLIF(GROUP_CONCAT(DISTINCT cp_prof.name ORDER BY cp_prof.name SEPARATOR ', '), ''),
                p.name
            ) AS professor_name
        FROM courses c
        LEFT JOIN professors p ON c.professor_id = p.id
        LEFT JOIN course_professor cp ON cp.course_id = c.id
        LEFT JOIN professors cp_prof ON cp_prof.id = cp.professor_id
        JOIN course_student cs ON c.id = cs.course_id
        WHERE cs.student_id = ?
        GROUP BY c.id, c.title, c.description, p.name
    ");
    $stmt->execute([$student_id]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($courses);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
