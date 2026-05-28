<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
include "finance_helpers.php";

$data = finance_json_input();

try {
    $actor = finance_actor($conn, $data);
    ensure_finance_tables($conn);

    $id = isset($data["id"]) ? (int)$data["id"] : 0;
    if ($id < 1) {
        echo json_encode(["success" => false, "error" => "ID e shpenzimit është e pavlefshme."]);
        exit;
    }

    $lookup = $conn->prepare("SELECT title, amount, category FROM company_expenses WHERE id = ?");
    $lookup->execute([$id]);
    $expense = $lookup->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("DELETE FROM company_expenses WHERE id = ?");
    $stmt->execute([$id]);

    if ($expense) {
        record_audit_log(
            $conn,
            $actor,
            "expenses",
            "expense_deleted",
            "company_expense",
            $id,
            $expense["title"],
            "Deleted expense {$expense['title']}",
            ["amount" => $expense["amount"], "category" => $expense["category"]]
        );
    }

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
