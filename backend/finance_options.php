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
    $actor = finance_actor($conn);
    ensure_finance_tables($conn);

    $teachers = $conn
        ->query("SELECT id, name FROM professors ORDER BY name ASC")
        ->fetchAll(PDO::FETCH_ASSOC);

    $coursesStmt = $conn->query("
        SELECT DISTINCT
            c.id,
            c.title,
            COALESCE(cp.professor_id, c.professor_id) AS teacher_id
        FROM courses c
        LEFT JOIN course_professor cp ON cp.course_id = c.id
        ORDER BY c.title ASC
    ");

    echo json_encode([
        "success" => true,
        "actor" => $actor,
        "teachers" => $teachers,
        "courses" => $coursesStmt->fetchAll(PDO::FETCH_ASSOC),
        "expense_categories" => ["Rent", "Utilities", "Supplies", "Marketing", "Maintenance", "Software", "Other"],
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
