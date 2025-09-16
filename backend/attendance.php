<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include 'db.php';

// --- Keep everything in UTC for consistency ---
date_default_timezone_set('UTC');
try { $conn->exec("SET time_zone = '+00:00'"); } catch (Throwable $e) { /* ignore if not MySQL */ }

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

    // Remove old marks for this session
    $stmtDelete = $conn->prepare("DELETE FROM attendance WHERE session_id = ?");
    $stmtDelete->execute([$session_id]);

    // Insert new attendance records (timestamp in UTC)
    $stmtInsert = $conn->prepare(
        "INSERT INTO attendance (session_id, student_id, status, updated_at)
         VALUES (?, ?, ?, UTC_TIMESTAMP())"
    );

    foreach ($attendance_records as $record) {
        if (!isset($record['student_id']) || !isset($record['status'])) {
            echo json_encode(['error' => 'Student ID and status are required']);
            exit;
        }

        $student_id = (int)$record['student_id'];
        $status = trim($record['status']);

        if ($student_id === 0 || $status === '') {
            echo json_encode(['error' => 'Invalid student ID or status']);
            exit;
        }

        $stmtInsert->execute([$session_id, $student_id, $status]);
    }

    // Find course of this session
    $stmtCourse = $conn->prepare("SELECT course_id FROM training_sessions WHERE id = ?");
    $stmtCourse->execute([$session_id]);
    $course_id = $stmtCourse->fetchColumn();

    $totalSessions = 0;
    $submittedSessionsBefore = 0;

    if ($course_id) {
        // Count totals BEFORE updating this session
        $stmtTotal = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ?");
        $stmtTotal->execute([$course_id]);
        $totalSessions = (int)$stmtTotal->fetchColumn();

        $stmtSubmitted = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ? AND submitted_at IS NOT NULL");
        $stmtSubmitted->execute([$course_id]);
        $submittedSessionsBefore = (int)$stmtSubmitted->fetchColumn();

        file_put_contents("debug_log.txt", "Total sessions: $totalSessions\n", FILE_APPEND);
        file_put_contents("debug_log.txt", "Submitted sessions before: $submittedSessionsBefore\n", FILE_APPEND);
    }

    // --- IMPORTANT CHANGE ---
    // When attendance is saved, set both submitted_at and session_date to now (UTC)
    $stmtUpdate = $conn->prepare(
        "UPDATE training_sessions
         SET submitted_at = UTC_TIMESTAMP(),
             session_date = UTC_TIMESTAMP(),
             submitted_after_seconds = ?
         WHERE id = ?"
    );
    $stmtUpdate->execute([$submitted_after_seconds, $session_id]);

    // Notify admin if your condition is met (left as-is)
    if ($course_id && $submittedSessionsBefore === $totalSessions - 4) {
        file_put_contents("debug_log.txt", "Triggering notification for course_id: $course_id\n", FILE_APPEND);

        $stmtTitle = $conn->prepare("SELECT title FROM courses WHERE id = ?");
        $stmtTitle->execute([$course_id]);
        $courseTitle = $stmtTitle->fetchColumn();

        $note = "📝 Make the certificates ready for course \"$courseTitle\". Only two session remains.";
        $stmtNotify = $conn->prepare("INSERT INTO admin_notifications (message, created_at) VALUES (?, UTC_TIMESTAMP())");
        $stmtNotify->execute([$note]);

        file_put_contents("debug_log.txt", "Notification inserted: $note\n", FILE_APPEND);
    } else {
        file_put_contents("debug_log.txt", "Notification condition NOT met.\n", FILE_APPEND);
    }

    // Get updated timestamps to return to the client
    $stmtTs = $conn->prepare(
        "SELECT
            DATE_FORMAT(submitted_at, '%Y-%m-%d %H:%i:%s') AS submitted_at,
            DATE_FORMAT(session_date, '%Y-%m-%d %H:%i:%s') AS session_date
         FROM training_sessions WHERE id = ?"
    );
    $stmtTs->execute([$session_id]);
    $ts = $stmtTs->fetch(PDO::FETCH_ASSOC) ?: [];

    $conn->commit();
    echo json_encode([
        'success' => true,
        'session' => $ts
    ]);

} catch (PDOException $e) {
    $conn->rollBack();
    file_put_contents("debug_log.txt", "Error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['error' => $e->getMessage()]);
}
