<?php
/**
 * Creates student_waitlist table and extends payment_method enum for bank/POS/cash/unpaid/free.
 */
include "db.php";

$out = ["waitlist" => false, "payments" => false, "course_payments" => false];

try {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS student_waitlist (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            surname VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone_number VARCHAR(100) NOT NULL,
            course_id INT NOT NULL,
            amount_to_pay DECIMAL(10,2) DEFAULT NULL,
            extra_note TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_waitlist_course (course_id),
            CONSTRAINT fk_waitlist_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    $out["waitlist"] = true;
    $columns = $conn->query("SHOW COLUMNS FROM student_waitlist")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array("amount_to_pay", $columns, true)) {
        $conn->exec("ALTER TABLE student_waitlist ADD COLUMN amount_to_pay DECIMAL(10,2) DEFAULT NULL AFTER course_id");
    }
} catch (PDOException $e) {
    $out["waitlist_error"] = $e->getMessage();
}

foreach (
    [
        "student_payments" => "payments",
        "student_course_payments" => "course_payments",
    ] as $table => $key
) {
    try {
        $conn->exec("ALTER TABLE `$table` MODIFY `payment_method` ENUM('Bank','All','Divided','POS','Cash','Did not pay','Free') NOT NULL");
        $out[$key] = true;
    } catch (PDOException $e) {
        $out[$key . "_error"] = $e->getMessage();
    }
}

header("Content-Type: application/json");
echo json_encode($out);
