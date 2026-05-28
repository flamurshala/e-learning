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
    if (!table_exists($conn, "payment_verifications")) {
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
        $where[] = "YEAR(p.payment_verification_date) = ?";
        $params[] = (int)$year;
    }

    if ($month !== "") {
        $where[] = "MONTH(p.payment_verification_date) = ?";
        $params[] = (int)$month;
    }

    if ($dateFrom !== "") {
        $where[] = "p.payment_verification_date >= ?";
        $params[] = $dateFrom;
    }

    if ($dateTo !== "") {
        $where[] = "p.payment_verification_date <= ?";
        $params[] = $dateTo;
    }

    if ($courseId > 0) {
        $where[] = "p.course_id = ?";
        $params[] = $courseId;
    }

    if ($name !== "") {
        $where[] = "COALESCE(NULLIF(TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))), ''), p.manual_student_name, '') LIKE ?";
        $params[] = "%" . $name . "%";
    }

    $sql = "
        SELECT
            p.id,
            p.payment_verification_number AS document_number,
            p.payment_verification_date AS document_date,
            p.description,
            p.total,
            p.file_path,
            p.created_at,
            COALESCE(NULLIF(TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))), ''), p.manual_student_name) AS student_name,
            c.title AS course_title
        FROM payment_verifications p
        LEFT JOIN students s ON s.id = p.student_id
        LEFT JOIN courses c ON c.id = p.course_id
    ";

    if ($where) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }

    $sql .= " ORDER BY p.payment_verification_date DESC, p.id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true, "documents" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
