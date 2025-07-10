<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;

if (!$student_id) {
    echo json_encode([]);
    exit;
}

try {
    // Get attendance for courses where this student is enrolled
    $stmt = $conn->prepare("
        SELECT 
            c.id AS course_id,
            c.title AS course_title,
            COUNT(ts.id) AS total_sessions,
            SUM(CASE WHEN a.status IN ('present', 'online') THEN 1 ELSE 0 END) AS attended_sessions
        FROM courses c
        JOIN course_student cs ON cs.course_id = c.id
        JOIN training_sessions ts ON ts.course_id = c.id
        LEFT JOIN attendance a ON a.session_id = ts.id AND a.student_id = ?
        WHERE cs.student_id = ?
        GROUP BY c.id
    ");
    $stmt->execute([$student_id, $student_id]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add percentage
    foreach ($courses as &$course) {
        $total = (int)$course['total_sessions'];
        $attended = (int)$course['attended_sessions'];
        $course['completion_percent'] = $total > 0 ? round(($attended / $total) * 100) : 0;
    }

    echo json_encode($courses);
} catch (PDOException $e) {
    echo json_encode([]);
}

