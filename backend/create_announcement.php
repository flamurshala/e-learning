<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$title = trim($data['title'] ?? '');
$content = trim($data['content'] ?? '');
$audience = $data['audience'] ?? '';

if (!$title || !$content || !in_array($audience, ['students', 'professors'])) {
    echo json_encode(["success" => false, "error" => "Missing or invalid fields"]);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO announcements (title, content, audience) VALUES (?, ?, ?)");
    $stmt->execute([$title, $content, $audience]);
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
