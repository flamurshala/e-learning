<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? null;
$title = trim($data['title'] ?? "");
$description = trim($data['description'] ?? "");
$professor_id = $data['professor_id'] ?? null;
$training_hours = intval($data['training_hours'] ?? 0);
$student_ids = $data['student_ids'] ?? [];

if (!$id || !$title || $training_hours <= 0) {
    echo json_encode(["success" => false, "error" => "Missing required fields"]);
    exit;
}

try {
    // 1. Update course info
    $stmt = $conn->prepare("UPDATE courses SET title = ?, description = ?, professor_id = ?, training_hours = ? WHERE id = ?");
    $success = $stmt->execute([$title, $description, $professor_id, $training_hours, $id]);

    if (!$success) {
        throw new Exception("Failed to update course record.");
    }

    // 2. Replace student mappings
    $conn->prepare("DELETE FROM course_student WHERE course_id = ?")->execute([$id]);
    $insertStudent = $conn->prepare("INSERT INTO course_student (student_id, course_id) VALUES (?, ?)");
    foreach ($student_ids as $studentId) {
        $insertStudent->execute([$studentId, $id]);
    }

    // 3. Sync sessions ONLY IF training_hours has changed
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM training_sessions WHERE course_id = ?");
    $stmt->execute([$id]);
    $currentSessionCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

    if ($currentSessionCount != $training_hours) {
        // Delete old sessions
        $conn->prepare("DELETE FROM training_sessions WHERE course_id = ?")->execute([$id]);

        // Re-insert sessions
        $insertSession = $conn->prepare("INSERT INTO training_sessions (course_id, session_number, session_date, created_at) VALUES (?, ?, ?, ?)");
        $now = date("Y-m-d H:i:s");
        $baseDate = date("Y-m-d");

        for ($i = 1; $i <= $training_hours; $i++) {
            $sessionDate = date("Y-m-d 12:00:00", strtotime("+$i day", strtotime($baseDate)));
            $insertSession->execute([$id, $i, $sessionDate, $now]);
        }
    }

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
