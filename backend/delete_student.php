<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *"); // Optional but helps with CORS

include "db.php";

// Get the incoming raw JSON and decode it
$data = json_decode(file_get_contents("php://input"), true);

// Validate ID
if (!isset($data['id']) || !is_numeric($data['id'])) {
    echo json_encode(["success" => false, "error" => "Missing or invalid ID"]);
    exit;
}

$student_id = (int) $data['id'];

try {
    // Delete from pivot table first if you are using one (optional):
    $stmt = $conn->prepare("DELETE FROM course_student WHERE student_id = ?");
    $stmt->execute([$student_id]);

    // Delete student from students table
    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->execute([$student_id]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
}
?>
