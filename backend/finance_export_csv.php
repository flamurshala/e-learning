<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
include "finance_helpers.php";

function csv_slug(string $value): string {
    $value = trim($value);

    if (function_exists("iconv")) {
        $ascii = @iconv("UTF-8", "ASCII//TRANSLIT", $value);
        if ($ascii !== false) {
            $value = $ascii;
        }
    }

    $value = strtolower($value);
    $value = preg_replace("/[^a-z0-9]+/", "-", $value);
    $value = trim($value, "-");

    return $value;
}

function csv_date_part(string $value): string {
    $value = trim($value);
    if ($value === "") {
        return "";
    }

    $date = DateTime::createFromFormat("Y-m-d", $value);
    return $date ? $date->format("d-m-Y") : csv_slug($value);
}

function csv_money($value): string {
    return number_format((float)($value ?? 0), 2, ".", "");
}

function csv_payment_amount(array $row): float {
    if (($row["payment_method"] ?? "") === "Divided") {
        return (float)($row["amount_month1"] ?? 0) + (float)($row["amount_month2"] ?? 0);
    }

    return (float)($row["payment_amount"] ?? 0);
}

function add_file_part(array &$parts, string $value): void {
    $slug = csv_slug($value);
    if ($slug !== "") {
        $parts[] = $slug;
    }
}

function add_date_file_part(array &$parts, string $value): void {
    $date = csv_date_part($value);
    if ($date !== "") {
        $parts[] = $date;
    }
}

try {
    finance_actor($conn);
    ensure_finance_tables($conn);

    $tab = trim($_GET["tab"] ?? "income");
    if (!in_array($tab, ["income", "expenses", "salaries"], true)) {
        $tab = "income";
    }

    $dateFrom = trim($_GET["date_from"] ?? "");
    $dateTo = trim($_GET["date_to"] ?? "");
    $courseId = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;
    $status = trim($_GET["status"] ?? "");
    $fileParts = [$tab];

    add_date_file_part($fileParts, $dateFrom);
    add_date_file_part($fileParts, $dateTo);

    $courseTitle = "";
    if ($courseId > 0) {
        $courseStmt = $conn->prepare("SELECT title FROM courses WHERE id = ? LIMIT 1");
        $courseStmt->execute([$courseId]);
        $courseTitle = (string)($courseStmt->fetchColumn() ?: "");
        add_file_part($fileParts, $courseTitle);
    }

    $headers = [];
    $rows = [];

    if ($tab === "income") {
        $where = [];
        $params = [];
        $student = trim($_GET["student"] ?? "");
        $amountSql = finance_income_amount_sql("sp");

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
            add_file_part($fileParts, $student);
        }
        if (in_array($status, ["Bank", "All", "Divided", "POS", "Cash", "Did not pay", "Free"], true)) {
            $where[] = "sp.payment_method = ?";
            $params[] = $status;
            add_file_part($fileParts, $status);
        }

        $whereSql = $where ? " WHERE " . implode(" AND ", $where) : "";
        $stmt = $conn->prepare("
            SELECT
                TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,
                c.title AS course_title,
                DATE(sp.created_at) AS payment_date,
                sp.payment_method,
                sp.amount_all,
                sp.amount_month1,
                sp.amount_month2,
                {$amountSql} AS payment_amount
            FROM student_payments sp
            LEFT JOIN students s ON s.id = sp.student_id
            LEFT JOIN courses c ON c.id = sp.course_id
            {$whereSql}
            ORDER BY sp.created_at DESC, sp.id DESC
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $headers = ["Student", "Course", "Date", "Payment Method", "Amount", "Installment 1", "Installment 2"];
        foreach ($data as $row) {
            $rows[] = [
                $row["student_name"] ?: "-",
                $row["course_title"] ?: "-",
                $row["payment_date"] ?: "-",
                $row["payment_method"] ?: "-",
                csv_money(csv_payment_amount($row)),
                ($row["payment_method"] ?? "") === "Divided" ? csv_money($row["amount_month1"] ?? 0) : "",
                ($row["payment_method"] ?? "") === "Divided" ? csv_money($row["amount_month2"] ?? 0) : "",
            ];
        }
    } elseif ($tab === "expenses") {
        $where = [];
        $params = [];
        $title = trim($_GET["title"] ?? "");
        $category = trim($_GET["category"] ?? "");
        $amountMin = trim($_GET["amount_min"] ?? "");
        $amountMax = trim($_GET["amount_max"] ?? "");

        if ($dateFrom !== "") {
            $where[] = "e.expense_date >= ?";
            $params[] = $dateFrom;
        }
        if ($dateTo !== "") {
            $where[] = "e.expense_date <= ?";
            $params[] = $dateTo;
        }
        if ($title !== "") {
            $where[] = "e.title LIKE ?";
            $params[] = "%" . $title . "%";
            add_file_part($fileParts, $title);
        }
        if ($category !== "") {
            $where[] = "e.category = ?";
            $params[] = $category;
            add_file_part($fileParts, $category);
        }
        if ($amountMin !== "") {
            $where[] = "e.amount >= ?";
            $params[] = (float)$amountMin;
            add_file_part($fileParts, "min-" . $amountMin);
        }
        if ($amountMax !== "") {
            $where[] = "e.amount <= ?";
            $params[] = (float)$amountMax;
            add_file_part($fileParts, "max-" . $amountMax);
        }

        $whereSql = $where ? " WHERE " . implode(" AND ", $where) : "";
        $stmt = $conn->prepare("
            SELECT e.*
            FROM company_expenses e
            {$whereSql}
            ORDER BY e.expense_date DESC, e.id DESC
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $headers = ["Title", "Date", "Category", "Invoice", "Payment Method", "Amount", "Description"];
        foreach ($data as $row) {
            $rows[] = [
                $row["title"] ?: "-",
                $row["expense_date"] ?: "-",
                $row["category"] ?: "-",
                $row["bill_number"] ?: "-",
                $row["payment_method"] ?: "-",
                csv_money($row["amount"] ?? 0),
                $row["description"] ?: "",
            ];
        }
    } else {
        $where = [];
        $params = [];
        $teacherId = isset($_GET["teacher_id"]) ? (int)$_GET["teacher_id"] : 0;

        if ($dateFrom !== "") {
            $where[] = "tsp.payment_date >= ?";
            $params[] = $dateFrom;
        }
        if ($dateTo !== "") {
            $where[] = "tsp.payment_date <= ?";
            $params[] = $dateTo;
        }
        if ($courseId > 0) {
            $where[] = "tsp.course_id = ?";
            $params[] = $courseId;
        }
        if ($teacherId > 0) {
            $where[] = "tsp.teacher_id = ?";
            $params[] = $teacherId;
            $teacherStmt = $conn->prepare("SELECT name FROM professors WHERE id = ? LIMIT 1");
            $teacherStmt->execute([$teacherId]);
            add_file_part($fileParts, (string)($teacherStmt->fetchColumn() ?: "teacher-" . $teacherId));
        }
        if (in_array($status, ["unpaid", "partially_paid", "paid"], true)) {
            $where[] = "tsp.status = ?";
            $params[] = $status;
            add_file_part($fileParts, $status);
        }

        $whereSql = $where ? " WHERE " . implode(" AND ", $where) : "";
        $stmt = $conn->prepare("
            SELECT
                tsp.*,
                p.name AS teacher_name,
                c.title AS course_title
            FROM teacher_salary_payments tsp
            LEFT JOIN professors p ON p.id = tsp.teacher_id
            LEFT JOIN courses c ON c.id = tsp.course_id
            {$whereSql}
            ORDER BY tsp.payment_date DESC, tsp.id DESC
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $headers = ["Professor", "Course", "Date", "Expected", "Paid", "Remaining", "Status", "Notes"];
        foreach ($data as $row) {
            $rows[] = [
                $row["teacher_name"] ?: "-",
                $row["course_title"] ?: "-",
                $row["payment_date"] ?: "-",
                $row["expected_amount"] === null ? "" : csv_money($row["expected_amount"]),
                csv_money($row["paid_amount"] ?? 0),
                csv_money($row["remaining_amount"] ?? 0),
                $row["status"] ?: "-",
                $row["notes"] ?: "",
            ];
        }
    }

    $fileName = implode("-", array_filter($fileParts)) . ".csv";

    header("Content-Type: text/csv; charset=UTF-8");
    header("Content-Disposition: attachment; filename=\"" . $fileName . "\"");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

    $out = fopen("php://output", "w");
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
