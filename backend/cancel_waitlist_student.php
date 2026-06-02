<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include "db.php";
include "audit_helpers.php";

function ensure_student_cancellations_table(PDO $conn): void {
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
}

$data = json_decode(file_get_contents("php://input"), true);
$actor = audit_actor_from_payload($data ?: []);
$id = isset($data["id"]) ? (int)$data["id"] : 0;

if ($id < 1) {
    echo json_encode(["success" => false, "error" => "Invalid waitlist ID."]);
    exit;
}

try {
    ensure_student_cancellations_table($conn);
    $conn->beginTransaction();

    $lookup = $conn->prepare("
        SELECT w.*, c.title AS course_title
        FROM student_waitlist w
        LEFT JOIN courses c ON c.id = w.course_id
        WHERE w.id = ?
        LIMIT 1
    ");
    $lookup->execute([$id]);
    $entry = $lookup->fetch(PDO::FETCH_ASSOC);

    if (!$entry) {
        $conn->rollBack();
        echo json_encode(["success" => false, "error" => "Waitlist entry not found."]);
        exit;
    }

    $insert = $conn->prepare("
        INSERT INTO student_cancellations
            (waitlist_id, name, surname, email, phone_number, course_id, amount_to_pay, extra_note, canceled_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insert->execute([
        $entry["id"],
        $entry["name"],
        $entry["surname"],
        $entry["email"],
        $entry["phone_number"],
        $entry["course_id"],
        $entry["amount_to_pay"] ?? null,
        $entry["extra_note"] ?? null,
        $actor["id"] ?? null,
    ]);
    $cancellationId = (int)$conn->lastInsertId();

    $delete = $conn->prepare("DELETE FROM student_waitlist WHERE id = ?");
    $delete->execute([$id]);

    record_audit_log(
        $conn,
        $actor,
        "waitlist",
        "waitlist_canceled",
        "student_cancellations",
        $cancellationId,
        trim(($entry["name"] ?? "") . " " . ($entry["surname"] ?? "")),
        "Moved waitlist entry to canceled list for " . ($entry["course_title"] ?? "course"),
        ["waitlist_id" => $id, "course_id" => $entry["course_id"] ?? null]
    );

    $conn->commit();
    echo json_encode(["success" => true, "id" => $cancellationId]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
