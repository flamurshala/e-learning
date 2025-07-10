<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
if (!$student_id) {
    echo json_encode(['error' => 'Missing student_id']);
    exit;
}

try {
    // Get student info
    $stmtStudent = $conn->prepare("SELECT id, name FROM students WHERE id = ?");
    $stmtStudent->execute([$student_id]);
    $student = $stmtStudent->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['error' => 'Student not found']);
        exit;
    }

    // Get courses student enrolled in
    $stmtCourses = $conn->prepare("
        SELECT c.id AS course_id, c.title
        FROM courses c
        JOIN course_student cs ON cs.course_id = c.id
        WHERE cs.student_id = ?
    ");
    $stmtCourses->execute([$student_id]);
    $courses = $stmtCourses->fetchAll(PDO::FETCH_ASSOC);

    $coursesWithProgress = [];

    foreach ($courses as $course) {
        $courseId = $course['course_id'];

        // Count total sessions for this course
        $stmtTotalSessions = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ?");
        $stmtTotalSessions->execute([$courseId]);
        $totalSessions = (int)$stmtTotalSessions->fetchColumn();

        // Count sessions attended by student (assuming status='present' means attended)
        $stmtAttendedSessions = $conn->prepare("
            SELECT COUNT(*)
            FROM attendance a
            JOIN training_sessions ts ON a.session_id = ts.id
            WHERE a.student_id = ? AND ts.course_id = ? AND a.status = 'present'
        ");
        $stmtAttendedSessions->execute([$student_id, $courseId]);
        $attendedSessions = (int)$stmtAttendedSessions->fetchColumn();

        // Calculate progress percentage safely
        $progressPercent = 0;
        if ($totalSessions > 0) {
            $progressPercent = round(($attendedSessions / $totalSessions) * 100);
        }

        $coursesWithProgress[] = [
            'course_id' => $courseId,
            'title' => $course['title'],
            'progress_percent' => $progressPercent,
        ];
    }

    $student['courses'] = $coursesWithProgress;

    echo json_encode($student);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
