<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
require_once "payment_verification_settings_helpers.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$label = trim($data["label"] ?? "");

if ($label === "") {
    echo json_encode(["success" => false, "error" => "Teksti i opsionit është i detyruesh?m."]);
    exit;
}

try {
    ensure_payment_verification_settings_tables($conn);

    $stmt = $conn->prepare("INSERT INTO payment_verification_description_options (label) VALUES (?)");
    $stmt->execute([$label]);

    echo json_encode(["success" => true, "id" => $conn->lastInsertId(), "label" => $label]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Nuk u arrit të shtohet opsioni. Mund të ekzistoj? tashmë."]);
}

