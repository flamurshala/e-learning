<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    // Query to get completed courses with professor name and enrolled students
    $stmt = $conn->prepare("
        SELECT 
            c.id,
            c.title,
            c.description,
            c.created_at,
            c.professor_id,
            c.completed,
            p.name AS professor_name,
            GROUP_CONCAT(s.name SEPARATOR ', ') AS students
        FROM courses c
        LEFT JOIN professors p ON c.professor_id = p.id
        LEFT JOIN course_student sc ON sc.course_id = c.id
        LEFT JOIN students s ON s.id = sc.student_id
        WHERE c.completed = 1
        GROUP BY c.id
        ORDER BY c.created_at DESC
    ");

    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Transform students from CSV string to array
    foreach ($courses as &$course) {
        if ($course['students']) {
            $course['students'] = explode(', ', $course['students']);
        } else {
            $course['students'] = [];
        }
    }

    echo json_encode($courses);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
