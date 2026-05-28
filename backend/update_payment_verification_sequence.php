<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$invoiceNumber = trim($data["document_number"] ?? $data["invoice_number"] ?? $data["payment_verification_number"] ?? "");

if (!preg_match('/^(\d{1,})\/(\d{4})$/', $invoiceNumber, $matches)) {
    echo json_encode(["success" => false, "error" => "Përdorni format fature si 001/2026."]);
    exit;
}

$nextNumber = (int)$matches[1];
$year = (int)$matches[2];

if ($nextNumber < 1) {
    echo json_encode(["success" => false, "error" => "Numri i faturës duhet të jetë të pakt?n 001."]);
    exit;
}

try {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS payment_verification_sequence (
            payment_verification_year INT NOT NULL PRIMARY KEY,
            last_number INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $lastNumber = $nextNumber - 1;
    $stmt = $conn->prepare("
        INSERT INTO payment_verification_sequence (payment_verification_year, last_number)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE last_number = VALUES(last_number)
    ");
    $stmt->execute([$year, $lastNumber]);

    echo json_encode([
        "success" => true,
        "document_number" => sprintf("%03d/%d", $nextNumber, $year),
        "payment_verification_number" => sprintf("%03d/%d", $nextNumber, $year),
        "sequence" => $nextNumber,
        "year" => $year
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

