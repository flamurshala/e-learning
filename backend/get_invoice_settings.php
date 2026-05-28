<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
require_once "invoice_settings_helpers.php";

try {
    ensure_invoice_settings_tables($conn);

    $stmt = $conn->query("SELECT id, label FROM invoice_description_options ORDER BY label ASC");
    echo json_encode([
        "success" => true,
        "description_options" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
