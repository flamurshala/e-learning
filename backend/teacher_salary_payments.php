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
    $teacherId = isset($_GET["teacher_id"]) ? (int)$_GET["teacher_id"] : 0;
    $courseId = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;
    $status = trim($_GET["status"] ?? "");
    $page = max(1, (int)($_GET["page"] ?? 1));
    $limit = 50;
    $offset = ($page - 1) * $limit;

    if ($dateFrom !== "") {
        $where[] = "tsp.payment_date >= ?";
        $params[] = $dateFrom;
    }
    if ($dateTo !== "") {
        $where[] = "tsp.payment_date <= ?";
        $params[] = $dateTo;
    }
    if ($teacherId > 0) {
        $where[] = "tsp.teacher_id = ?";
        $params[] = $teacherId;
    }
    if ($courseId > 0) {
        $where[] = "tsp.course_id = ?";
        $params[] = $courseId;
    }
    if (in_array($status, ["unpaid", "partially_paid", "paid"], true)) {
        $where[] = "tsp.status = ?";
        $params[] = $status;
    }

    $fromSql = "
        FROM teacher_salary_payments tsp
        LEFT JOIN professors p ON p.id = tsp.teacher_id
        LEFT JOIN courses c ON c.id = tsp.course_id
        LEFT JOIN admins ca ON ca.id = tsp.created_by
        LEFT JOIN admins ua ON ua.id = tsp.updated_by
    ";
    $whereSql = $where ? " WHERE " . implode(" AND ", $where) : "";

    $countStmt = $conn->prepare("SELECT COUNT(*) {$fromSql}{$whereSql}");
    $countStmt->execute($params);
    $totalRows = (int)$countStmt->fetchColumn();

    $totalStmt = $conn->prepare("SELECT COALESCE(SUM(tsp.paid_amount), 0) {$fromSql}{$whereSql}");
    $totalStmt->execute($params);
    $total = (float)$totalStmt->fetchColumn();

    $sql = "
        SELECT
            tsp.*,
            p.name AS teacher_name,
            c.title AS course_title,
            ca.username AS created_by_username,
            ua.username AS updated_by_username
        {$fromSql}
        {$whereSql}
        ORDER BY tsp.payment_date DESC, tsp.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $salarySummary = null;

    if ($teacherId > 0 && $courseId > 0) {
        $expectedStmt = $conn->prepare("
            SELECT expected_amount
            FROM teacher_salary_payments
            WHERE teacher_id = ? AND course_id = ? AND expected_amount IS NOT NULL
            ORDER BY id DESC
            LIMIT 1
        ");
        $expectedStmt->execute([$teacherId, $courseId]);
        $expectedValue = $expectedStmt->fetchColumn();
        $expectedAmount = $expectedValue === false ? null : (float)$expectedValue;

        $paidStmt = $conn->prepare("
            SELECT COALESCE(SUM(paid_amount), 0)
            FROM teacher_salary_payments
            WHERE teacher_id = ? AND course_id = ?
        ");
        $paidStmt->execute([$teacherId, $courseId]);
        $totalPaid = (float)$paidStmt->fetchColumn();

        if ($expectedAmount === null) {
            $remainingAmount = null;
            $summaryStatus = $totalPaid > 0 ? "paid" : "unpaid";
        } else {
            $remainingAmount = max($expectedAmount - $totalPaid, 0);
            if ($totalPaid <= 0) {
                $summaryStatus = "unpaid";
            } elseif ($totalPaid < $expectedAmount) {
                $summaryStatus = "partially_paid";
            } else {
                $summaryStatus = "paid";
            }
        }

        $salarySummary = [
            "expected_amount" => $expectedAmount,
            "total_paid" => round($totalPaid, 2),
            "remaining_amount" => $remainingAmount === null ? null : round($remainingAmount, 2),
            "status" => $summaryStatus,
        ];
    }

    echo json_encode([
        "success" => true,
        "payments" => $payments,
        "total_paid" => round($total, 2),
        "salary_summary" => $salarySummary,
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
