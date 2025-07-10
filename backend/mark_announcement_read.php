<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? 0;
$announcement_id = $data['announcement_id'] ?? 0;
$user_type = $data['user_type'] ?? '';

if (!$user_id || !$announcement_id || !in_array($user_type, ['student', 'professor'])) {
    echo json_encode(["success" => false, "error" => "Invalid input"]);
    exit;
}

// Prevent duplicates
$stmt = $conn->prepare("
  SELECT id FROM announcement_reads 
  WHERE user_id = ? AND announcement_id = ? AND user_type = ?
");
$stmt->execute([$user_id, $announcement_id, $user_type]);

if (!$stmt->fetch()) {
    $insert = $conn->prepare("
      INSERT INTO announcement_reads (user_id, announcement_id, user_type)
      VALUES (?, ?, ?)
    ");
    $insert->execute([$user_id, $announcement_id, $user_type]);
}

echo json_encode(["success" => true]);
