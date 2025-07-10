<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$ids = $data['ids'] ?? [];

if (empty($ids)) {
    echo json_encode(["error" => "No IDs provided"]);
    exit;
}

$placeholders = rtrim(str_repeat('?,', count($ids)), ',');
$stmt = $conn->prepare("DELETE FROM admin_notifications WHERE id IN ($placeholders)");

if ($stmt->execute($ids)) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Deletion failed"]);
}
?>
