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

if (!$id || !$title) {
    echo json_encode(["success" => false, "error" => "Missing required fields"]);
    exit;
}

$stmt = $conn->prepare("UPDATE courses SET title = ?, description = ?, professor_id = ? WHERE id = ?");
$success = $stmt->execute([$title, $description, $professor_id, $id]);

echo json_encode(["success" => $success]);
