<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    $columns = $conn->query("SHOW COLUMNS FROM student_waitlist")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array("amount_to_pay", $columns, true)) {
        $conn->exec("ALTER TABLE student_waitlist ADD COLUMN amount_to_pay DECIMAL(10,2) DEFAULT NULL AFTER course_id");
    }

    $stmt = $conn->query("
        SELECT w.id, w.name, w.surname, w.email, w.phone_number, w.course_id, w.amount_to_pay, w.extra_note, w.created_at,
               c.title AS course_title
        FROM student_waitlist w
        INNER JOIN courses c ON c.id = w.course_id
        ORDER BY w.created_at DESC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
