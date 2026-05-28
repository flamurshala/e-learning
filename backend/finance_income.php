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
    $amountSql = finance_income_amount_sql("sp");

    $dateFrom = trim($_GET["date_from"] ?? "");
    $dateTo = trim($_GET["date_to"] ?? "");
    $courseId = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;
    $student = trim($_GET["student"] ?? "");
    $status = trim($_GET["status"] ?? "");
    $page = max(1, (int)($_GET["page"] ?? 1));
    $limit = 50;
    $offset = ($page - 1) * $limit;

    if ($dateFrom !== "") {
        $where[] = "DATE(sp.created_at) >= ?";
        $params[] = $dateFrom;
    }
    if ($dateTo !== "") {
        $where[] = "DATE(sp.created_at) <= ?";
        $params[] = $dateTo;
    }
    if ($courseId > 0) {
        $where[] = "sp.course_id = ?";
        $params[] = $courseId;
    }
    if ($student !== "") {
        $where[] = "TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) LIKE ?";
        $params[] = "%" . $student . "%";
    }
    if ($status === "paid") {
        $where[] = "({$amountSql}) > 0";
    } elseif ($status === "unpaid") {
        $where[] = "({$amountSql}) <= 0";
    } elseif ($status === "cash") {
        $where[] = "sp.payment_method = 'Cash'";
    } elseif ($status === "pos") {
        $where[] = "sp.payment_method = 'POS'";
    }

    $fromSql = "
        FROM student_payments sp
        LEFT JOIN students s ON s.id = sp.student_id
        LEFT JOIN courses c ON c.id = sp.course_id
    ";

    $whereSql = $where ? " WHERE " . implode(" AND ", $where) : "";

    $countStmt = $conn->prepare("SELECT COUNT(*) {$fromSql}{$whereSql}");
    $countStmt->execute($params);
    $totalRows = (int)$countStmt->fetchColumn();

    $totalStmt = $conn->prepare("SELECT COALESCE(SUM({$amountSql}), 0) {$fromSql}{$whereSql}");
    $totalStmt->execute($params);
    $total = (float)$totalStmt->fetchColumn();

    $sql = "
        SELECT
            sp.id,
            sp.student_id,
            sp.course_id,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,
            c.title AS course_title,
            sp.payment_method,
            {$amountSql} AS payment_amount,
            CASE WHEN ({$amountSql}) > 0 THEN 'paid' ELSE 'unpaid' END AS payment_status,
            DATE(sp.created_at) AS payment_date,
            sp.created_at
        {$fromSql}
        {$whereSql}
        ORDER BY sp.created_at DESC, sp.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "payments" => $payments,
        "total_income" => round($total, 2),
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
