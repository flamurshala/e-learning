<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

// Decode incoming JSON
$data = json_decode(file_get_contents("php://input"), true);

// Extract and validate input
$id = $data['id'] ?? null;
$title = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$professor_id = $data['professor_id'] ?? null;
$student_ids = is_array($data['student_ids']) ? $data['student_ids'] : [];
$requestedTrainingHours = intval($data['training_hours'] ?? 0);

// Validation
if (!$id || !$title || !$professor_id) {
    echo json_encode(["success" => false, "error" => "Missing required fields"]);
    exit;
}

try {
    // Step 1: Count existing sessions
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM training_sessions WHERE course_id = ?");
    $stmt->execute([$id]);
    $existingSessionCount = (int) ($stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0);

    // Step 2: Update course info
    $stmt = $conn->prepare("UPDATE courses SET title = ?, description = ?, professor_id = ? WHERE id = ?");
    $success = $stmt->execute([$title, $description, $professor_id, $id]);

    if (!$success) {
        $error = $stmt->errorInfo();
        throw new Exception("Failed to update course: " . $error[2]);
    }

    // Step 3: Sync students
    $conn->prepare("DELETE FROM course_student WHERE course_id = ?")->execute([$id]);

    $insertStudent = $conn->prepare("INSERT INTO course_student (student_id, course_id) VALUES (?, ?)");
    foreach ($student_ids as $sid) {
        $insertStudent->execute([$sid, $id]);
    }

    // Step 4: Adjust training sessions
    if ($requestedTrainingHours > 0) {
        if ($requestedTrainingHours < $existingSessionCount) {
            // Delete only the latest sessions
            $toDelete = $existingSessionCount - $requestedTrainingHours;
            $stmt = $conn->prepare(
                "DELETE FROM training_sessions 
                 WHERE course_id = ? AND session_number > ?"
            );
            $stmt->execute([$id, $requestedTrainingHours]);
        } elseif ($requestedTrainingHours > $existingSessionCount) {
            // Add more sessions
            $stmt = $conn->prepare("SELECT MAX(session_number) as max_num FROM training_sessions WHERE course_id = ?");
            $stmt->execute([$id]);
            $startFrom = (int)($stmt->fetch(PDO::FETCH_ASSOC)['max_num'] ?? 0);

            $insertSession = $conn->prepare(
                "INSERT INTO training_sessions (course_id, session_number, session_date, created_at) VALUES (?, ?, ?, ?)"
            );

            $now = date("Y-m-d H:i:s");
            $startDate = date("Y-m-d");

            for ($i = $startFrom + 1; $i <= $requestedTrainingHours; $i++) {
                $sessionDate = date("Y-m-d 12:00:00", strtotime("+$i day", strtotime($startDate)));
                $insertSession->execute([$id, $i, $sessionDate, $now]);
            }
        }
    }

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
