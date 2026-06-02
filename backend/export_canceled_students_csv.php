<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";

function csv_date_filename(): string {
    return (new DateTime())->format("d-m-Y");
}

try {
    $stmt = $conn->query("
        SELECT
            sc.name,
            sc.surname,
            sc.email,
            sc.phone_number,
            c.title AS course_title,
            sc.amount_to_pay,
            sc.extra_note,
            sc.canceled_at,
            a.username AS canceled_by_username
        FROM student_cancellations sc
        LEFT JOIN courses c ON c.id = sc.course_id
        LEFT JOIN admins a ON a.id = sc.canceled_by
        ORDER BY sc.canceled_at DESC, sc.id DESC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $fileName = "canceled-students-" . csv_date_filename() . ".csv";
    header("Content-Type: text/csv; charset=UTF-8");
    header("Content-Disposition: attachment; filename=\"" . $fileName . "\"");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

    $out = fopen("php://output", "w");
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ["Name", "Surname", "Email", "Phone", "Course", "Amount", "Note", "Canceled At", "Canceled By"]);

    foreach ($rows as $row) {
        fputcsv($out, [
            $row["name"] ?: "",
            $row["surname"] ?: "",
            $row["email"] ?: "",
            $row["phone_number"] ?: "",
            $row["course_title"] ?: "",
            $row["amount_to_pay"] === null ? "" : number_format((float)$row["amount_to_pay"], 2, ".", ""),
            $row["extra_note"] ?: "",
            $row["canceled_at"] ?: "",
            $row["canceled_by_username"] ?: "",
        ]);
    }

    fclose($out);
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => $e->getMessage()]);
}
