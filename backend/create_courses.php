<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

// ✅ Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ✅ Decode incoming JSON
$data = json_decode(file_get_contents("php://input"), true);

// ✅ Validate required fields
$title = $data['title'] ?? '';
$description = $data['description'] ?? '';
$professor_id = $data['professor_id'] ?? null;
$student_ids = $data['student_ids'] ?? [];
$training_hours = isset($data['training_hours']) ? (int)$data['training_hours'] : 0;

// ✅ Add 2 extra training hours (sessions)
$training_hours += 2;

if (!$title || !$description || !$professor_id || $training_hours < 1) {
    echo json_encode(['error' => 'Missing fields or invalid training hours']);
    exit;
}

try {
    $conn->beginTransaction();

    // ✅ Insert course
    $stmt = $conn->prepare("INSERT INTO courses (title, description, professor_id) VALUES (?, ?, ?)");
    $stmt->execute([$title, $description, $professor_id]);
    $course_id = $conn->lastInsertId();

    // ✅ Insert course_professor
    $stmt2 = $conn->prepare("INSERT INTO course_professor (course_id, professor_id) VALUES (?, ?)");
    $stmt2->execute([$course_id, $professor_id]);

    // ✅ Insert students
    if (!empty($student_ids)) {
        $stmt3 = $conn->prepare("INSERT INTO course_student (course_id, student_id) VALUES (?, ?)");
        foreach ($student_ids as $sid) {
            $stmt3->execute([$course_id, $sid]);
        }
    }

    // ✅ Insert training sessions
    $startDate = new DateTime();
    $stmt4 = $conn->prepare("INSERT INTO training_sessions (course_id, session_number, session_date) VALUES (?, ?, ?)");

    for ($i = 1; $i <= $training_hours; $i++) {
        $sessionDate = clone $startDate;
        $sessionDate->modify("+" . ($i - 1) . " days");
        $stmt4->execute([$course_id, $i, $sessionDate->format('Y-m-d H:i:s')]);
    }

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    $conn->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
