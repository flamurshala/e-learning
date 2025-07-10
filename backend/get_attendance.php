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
    $stmt = $conn->prepare("
        SELECT 
            a.id as attendance_id,
            a.session_id,
            a.student_id,
            a.status,
            s.name as student_name,
            ts.session_number,
            ts.session_date,
            ts.submitted_after_seconds
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN training_sessions ts ON a.session_id = ts.id
        WHERE ts.course_id = ?
        ORDER BY ts.session_number, s.name
    ");
    $stmt->execute([$course_id]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($attendance);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
