<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$year = (int)date('Y');

try {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS payment_verification_sequence (
            payment_verification_year INT NOT NULL PRIMARY KEY,
            last_number INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $stmt = $conn->prepare("SELECT last_number FROM payment_verification_sequence WHERE payment_verification_year = ?");
    $stmt->execute([$year]);
    $lastNumber = (int)($stmt->fetchColumn() ?: 0);
    $nextNumber = $lastNumber + 1;

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

