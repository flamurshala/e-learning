<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS student_cancellations (
            id INT NOT NULL AUTO_INCREMENT,
            waitlist_id INT DEFAULT NULL,
            name VARCHAR(100) NOT NULL,
            surname VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone_number VARCHAR(50) NOT NULL,
            course_id INT DEFAULT NULL,
            amount_to_pay DECIMAL(10,2) DEFAULT NULL,
            extra_note TEXT DEFAULT NULL,
            canceled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            canceled_by INT DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_student_cancellations_course (course_id),
            KEY idx_student_cancellations_email (email),
            KEY idx_student_cancellations_canceled_at (canceled_at),
            KEY idx_student_cancellations_canceled_by (canceled_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $stmt = $conn->query("
        SELECT
            sc.id,
            sc.waitlist_id,
            sc.name,
            sc.surname,
            sc.email,
            sc.phone_number,
            sc.course_id,
            sc.amount_to_pay,
            sc.extra_note,
            sc.canceled_at,
            c.title AS course_title,
            a.username AS canceled_by_username
        FROM student_cancellations sc
        LEFT JOIN courses c ON c.id = sc.course_id
        LEFT JOIN admins a ON a.id = sc.canceled_by
        ORDER BY sc.canceled_at DESC, sc.id DESC
    ");

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
