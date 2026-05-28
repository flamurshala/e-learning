<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

function table_exists(PDO $conn, string $table): bool {
    $stmt = $conn->prepare("SHOW TABLES LIKE ?");
    $stmt->execute([$table]);
    return (bool)$stmt->fetchColumn();
}

try {
    if (!table_exists($conn, "invoices")) {
        echo json_encode(["success" => true, "documents" => []]);
        exit;
    }

    $where = [];
    $params = [];

    $year = trim($_GET["year"] ?? "");
    $month = trim($_GET["month"] ?? "");
    $dateFrom = trim($_GET["date_from"] ?? "");
    $dateTo = trim($_GET["date_to"] ?? "");
    $name = trim($_GET["name"] ?? "");
    $courseId = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;

    if ($year !== "") {
        $where[] = "YEAR(i.invoice_date) = ?";
        $params[] = (int)$year;
    }

    if ($month !== "") {
        $where[] = "MONTH(i.invoice_date) = ?";
        $params[] = (int)$month;
    }

    if ($dateFrom !== "") {
        $where[] = "i.invoice_date >= ?";
        $params[] = $dateFrom;
    }

    if ($dateTo !== "") {
        $where[] = "i.invoice_date <= ?";
        $params[] = $dateTo;
    }

    if ($courseId > 0) {
        $where[] = "i.course_id = ?";
        $params[] = $courseId;
    }

    if ($name !== "") {
        $where[] = "COALESCE(NULLIF(TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))), ''), i.manual_student_name, '') LIKE ?";
        $params[] = "%" . $name . "%";
    }

    $sql = "
        SELECT
            i.id,
            i.invoice_number AS document_number,
            i.invoice_date AS document_date,
            i.description,
            i.total,
            i.file_path,
            i.created_at,
            COALESCE(NULLIF(TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))), ''), i.manual_student_name) AS student_name,
            c.title AS course_title
        FROM invoices i
        LEFT JOIN students s ON s.id = i.student_id
        LEFT JOIN courses c ON c.id = i.course_id
    ";

    if ($where) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }

    $sql .= " ORDER BY i.invoice_date DESC, i.id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true, "documents" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
