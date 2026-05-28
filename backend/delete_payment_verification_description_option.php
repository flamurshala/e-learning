<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
require_once "payment_verification_settings_helpers.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$id = isset($data["id"]) ? (int)$data["id"] : 0;

if ($id < 1) {
    echo json_encode(["success" => false, "error" => "ID e opsionit është e pavlefshme."]);
    exit;
}

try {
    ensure_payment_verification_settings_tables($conn);

    $stmt = $conn->prepare("DELETE FROM payment_verification_description_options WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

