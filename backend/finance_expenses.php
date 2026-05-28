<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
include "finance_helpers.php";

try {
    finance_actor($conn);
    ensure_finance_tables($conn);

    $where = [];
    $params = [];
    $dateFrom = trim($_GET["date_from"] ?? "");
    $dateTo = trim($_GET["date_to"] ?? "");
    $category = trim($_GET["category"] ?? "");
    $amountMin = trim($_GET["amount_min"] ?? "");
    $amountMax = trim($_GET["amount_max"] ?? "");
    $page = max(1, (int)($_GET["page"] ?? 1));
    $limit = 50;
    $offset = ($page - 1) * $limit;

    if ($dateFrom !== "") {
        $where[] = "expense_date >= ?";
        $params[] = $dateFrom;
    }
    if ($dateTo !== "") {
        $where[] = "expense_date <= ?";
        $params[] = $dateTo;
    }
    if ($category !== "") {
        $where[] = "category = ?";
        $params[] = $category;
    }
    if ($amountMin !== "") {
        $where[] = "amount >= ?";
        $params[] = (float)$amountMin;
    }
    if ($amountMax !== "") {
        $where[] = "amount <= ?";
        $params[] = (float)$amountMax;
    }

    $fromSql = "
        FROM company_expenses e
        LEFT JOIN admins ca ON ca.id = e.created_by
        LEFT JOIN admins ua ON ua.id = e.updated_by
    ";
    $whereSql = $where ? " WHERE " . implode(" AND ", $where) : "";

    $countStmt = $conn->prepare("SELECT COUNT(*) {$fromSql}{$whereSql}");
    $countStmt->execute($params);
    $totalRows = (int)$countStmt->fetchColumn();

    $totalStmt = $conn->prepare("SELECT COALESCE(SUM(e.amount), 0) {$fromSql}{$whereSql}");
    $totalStmt->execute($params);
    $total = (float)$totalStmt->fetchColumn();

    $sql = "
        SELECT e.*, ca.username AS created_by_username, ua.username AS updated_by_username
        {$fromSql}
        {$whereSql}
        ORDER BY e.expense_date DESC, e.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "expenses" => $expenses,
        "total_expenses" => round($total, 2),
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total_rows" => $totalRows,
            "total_pages" => max(1, (int)ceil($totalRows / $limit)),
        ],
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
