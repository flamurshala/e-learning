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
        echo json_encode(["success" => false, "error" => "Missing teacher salary payment ID."]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT tsp.id, tsp.teacher_id, tsp.course_id, tsp.paid_amount, p.name AS teacher_name, c.title AS course_title
        FROM teacher_salary_payments tsp
        LEFT JOIN professors p ON p.id = tsp.teacher_id
        LEFT JOIN courses c ON c.id = tsp.course_id
        WHERE tsp.id = ?
        LIMIT 1
    ");
    $stmt->execute([$id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        echo json_encode(["success" => false, "error" => "Teacher salary payment not found."]);
        exit;
    }

    $deleteStmt = $conn->prepare("DELETE FROM teacher_salary_payments WHERE id = ?");
    $deleteStmt->execute([$id]);

    record_audit_log(
        $conn,
        $actor,
        "teacher_salaries",
        "teacher_salary_payment_deleted",
        "teacher_salary_payment",
        $id,
        $payment["teacher_name"] ?: "Teacher salary payment",
        "Deleted teacher salary payment for " . ($payment["teacher_name"] ?: "teacher") . " / " . ($payment["course_title"] ?: "course"),
        [
            "teacher_id" => (int)($payment["teacher_id"] ?? 0),
            "course_id" => (int)($payment["course_id"] ?? 0),
            "paid_amount" => (float)($payment["paid_amount"] ?? 0),
        ]
    );

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
