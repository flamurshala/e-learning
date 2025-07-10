<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include "db.php";

// Read and decode JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
$student_id = $data['id'] ?? null;
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$student_id || !$name || !$email || !$password) {
    echo json_encode([
        "success" => false,
        "error" => "Missing data"
    ]);
    exit;
}

// Update student in the database
try {
    $stmt = $conn->prepare("UPDATE students SET name = ?, email = ?, password = ? WHERE id = ?");
    $stmt->execute([$name, $email, $password, $student_id]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>
