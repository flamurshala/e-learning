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
    $title = trim($data["title"] ?? "");
    $billNumber = trim($data["bill_number"] ?? "");
    $category = trim($data["category"] ?? "");
    $amount = isset($data["amount"]) ? (float)$data["amount"] : 0;
    $expenseDate = trim($data["expense_date"] ?? "");
    $paymentMethod = trim($data["payment_method"] ?? "");
    $description = trim($data["description"] ?? "");
    $allowedCategories = ["Rent", "Utilities", "Supplies", "Marketing", "Maintenance", "Software", "Other"];

    if ($title === "" || $amount <= 0 || $expenseDate === "" || !in_array($category, $allowedCategories, true)) {
        echo json_encode(["success" => false, "error" => "Titulli, kategoria, shuma dhe data janë të detyrueshme."]);
        exit;
    }

    if ($id > 0) {
        $stmt = $conn->prepare("
            UPDATE company_expenses
            SET title = ?, bill_number = ?, category = ?, amount = ?, expense_date = ?, payment_method = ?, description = ?, updated_by = ?
            WHERE id = ?
        ");
        $stmt->execute([$title, $billNumber ?: null, $category, $amount, $expenseDate, $paymentMethod ?: null, $description ?: null, $actor["id"], $id]);
        $expenseId = $id;
        $action = "expense_updated";
        $message = "Expense updated.";
    } else {
        $stmt = $conn->prepare("
            INSERT INTO company_expenses
            (title, bill_number, category, amount, expense_date, payment_method, description, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$title, $billNumber ?: null, $category, $amount, $expenseDate, $paymentMethod ?: null, $description ?: null, $actor["id"], $actor["id"]]);
        $expenseId = (int)$conn->lastInsertId();
        $action = "expense_created";
        $message = "Expense created.";
    }

    record_audit_log(
        $conn,
        $actor,
        "expenses",
        $action,
        "company_expense",
        $expenseId,
        $title,
        "{$message} {$title}",
        ["amount" => $amount, "category" => $category, "expense_date" => $expenseDate]
    );

    echo json_encode(["success" => true, "message" => $message, "id" => $expenseId]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
