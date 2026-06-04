<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *"); // Optional but helps with CORS

include "db.php";
include "audit_helpers.php";

// Get the incoming raw JSON and decode it
$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);

// Validate ID
if (!isset($data['id']) || !is_numeric($data['id'])) {
    echo json_encode(["success" => false, "error" => "Missing or invalid ID"]);
    exit;
}

$student_id = (int) $data['id'];

try {
    $studentStmt = $conn->prepare("SELECT TRIM(CONCAT(COALESCE(name, ''), ' ', COALESCE(surname, ''))) AS student_name, email FROM students WHERE id = ? LIMIT 1");
    $studentStmt->execute([$student_id]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // Delete from pivot table first if you are using one (optional):
    $stmt = $conn->prepare("DELETE FROM course_student WHERE student_id = ?");
    $stmt->execute([$student_id]);

    // Delete student from students table
    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->execute([$student_id]);

    record_audit_log(
        $conn,
        $actor,
        "students",
        "student_deleted",
        "student",
        $student_id,
        $student['student_name'] ?? "Student #{$student_id}",
        "Deleted student " . ($student['student_name'] ?? "Student #{$student_id}"),
        ["email" => $student['email'] ?? null]
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
}
?>
