<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
include "db.php";

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (
    empty($data['course_id']) ||
    empty($data['professor_id']) ||
    empty($data['title']) ||
    empty($data['description']) ||
    empty($data['due_date'])
) {
    echo json_encode(["error" => "All fields are required"]);
    exit;
}

$course_id = $data['course_id'];
$professor_id = $data['professor_id'];
$title = trim($data['title']);
$description = trim($data['description']);
$due_date = $data['due_date'];

try {
    $stmt = $conn->prepare("INSERT INTO assignments (course_id, professor_id, title, description, due_date) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$course_id, $professor_id, $title, $description, $due_date]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
