<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
include 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$session_id = isset($data['session_id']) ? (int)$data['session_id'] : 0;
$professor_id = isset($data['professor_id']) ? (int)$data['professor_id'] : 0;
$attendance_records = isset($data['attendance']) ? $data['attendance'] : [];
$submitted_after_seconds = isset($data['submitted_after_seconds']) ? (int)$data['submitted_after_seconds'] : null;

if (!$session_id || !$professor_id || !is_array($attendance_records)) {
    echo json_encode(['error' => 'Invalid input data']);
    exit;
}

try {
    $conn->beginTransaction();

    $stmtDelete = $conn->prepare("DELETE FROM attendance WHERE session_id = ?");
    $stmtDelete->execute([$session_id]);

    // Insert new attendance records
    $stmtInsert = $conn->prepare("INSERT INTO attendance (session_id, student_id, status, updated_at) VALUES (?, ?, ?, NOW())");

    foreach ($attendance_records as $record) {
        if (!isset($record['student_id']) || !isset($record['status'])) {
            echo json_encode(['error' => 'Student ID and status are required']);
            exit;
        }

        $student_id = (int)$record['student_id'];
        $status = $record['status'];

        if ($student_id === 0 || $status === '') {
            echo json_encode(['error' => 'Invalid student ID or status']);
            exit;
        }

        $stmtInsert->execute([$session_id, $student_id, $status]);
    }

    // Get course_id before updating session submission
    $stmtCourse = $conn->prepare("SELECT course_id FROM training_sessions WHERE id = ?");
    $stmtCourse->execute([$session_id]);
    $course_id = $stmtCourse->fetchColumn();

    if ($course_id) {
        // Count total sessions and submitted sessions BEFORE this one
        $stmtTotal = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ?");
        $stmtTotal->execute([$course_id]);
        $totalSessions = (int)$stmtTotal->fetchColumn();

        $stmtSubmitted = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ? AND submitted_at IS NOT NULL");
        $stmtSubmitted->execute([$course_id]);
        $submittedSessionsBefore = (int)$stmtSubmitted->fetchColumn();

        // Debug logs for counts
        file_put_contents("debug_log.txt", "Total sessions: $totalSessions\n", FILE_APPEND);
        file_put_contents("debug_log.txt", "Submitted sessions before: $submittedSessionsBefore\n", FILE_APPEND);
    }

    // Now update the session with submission time
    $stmtUpdate = $conn->prepare("UPDATE training_sessions SET submitted_at = NOW(), submitted_after_seconds = ? WHERE id = ?");
    $stmtUpdate->execute([$submitted_after_seconds, $session_id]);

    // Notify admin ONLY if this was the second-to-last submission
    if ($course_id && $submittedSessionsBefore === $totalSessions - 2) {
        file_put_contents("debug_log.txt", "Triggering notification for course_id: $course_id\n", FILE_APPEND);

        $stmtTitle = $conn->prepare("SELECT title FROM courses WHERE id = ?");
        $stmtTitle->execute([$course_id]);
        $courseTitle = $stmtTitle->fetchColumn();

        $note = "📝 Make the certificates ready for course \"$courseTitle\". Only one session remains.";
        $stmtNotify = $conn->prepare("INSERT INTO admin_notifications (message, created_at) VALUES (?, NOW())");
        $stmtNotify->execute([$note]);

        file_put_contents("debug_log.txt", "Notification inserted: $note\n", FILE_APPEND);
    } else {
        file_put_contents("debug_log.txt", "Notification condition NOT met.\n", FILE_APPEND);
    }

    $conn->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    $conn->rollBack();
    file_put_contents("debug_log.txt", "Error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['error' => $e->getMessage()]);
}
