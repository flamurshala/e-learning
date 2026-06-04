<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
include "audit_helpers.php";

function ensure_student_cancellations_table_for_temporary(PDO $conn): void {
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

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);

$name = trim($data["name"] ?? "");
$surname = trim($data["surname"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone_number"] ?? "");
$courseId = isset($data["course_id"]) ? (int)$data["course_id"] : 0;
$amountToPay = isset($data["amount_to_pay"]) && $data["amount_to_pay"] !== "" ? round((float)$data["amount_to_pay"], 2) : null;
$extraNote = trim($data["extra_note"] ?? "");
$canceledDate = trim($data["canceled_date"] ?? "");

if ($name === "" || $surname === "" || $email === "" || $phone === "" || $courseId < 1 || $canceledDate === "") {
    echo json_encode(["success" => false, "error" => "Name, surname, email, phone, course and canceled date are required"]);
    exit;
}

$date = DateTime::createFromFormat("Y-m-d", $canceledDate);
$dateErrors = DateTime::getLastErrors();
if (!$date || ($dateErrors !== false && ($dateErrors["warning_count"] > 0 || $dateErrors["error_count"] > 0))) {
    echo json_encode(["success" => false, "error" => "Invalid canceled date"]);
    exit;
}

$canceledDateTime = $date->format("Y-m-d") . " 00:00:00";

try {
    ensure_student_cancellations_table_for_temporary($conn);

    $courseStmt = $conn->prepare("SELECT id, title FROM courses WHERE id = ? LIMIT 1");
    $courseStmt->execute([$courseId]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);
    if (!$course) {
        echo json_encode(["success" => false, "error" => "Course not found"]);
        exit;
    }

    $insert = $conn->prepare("
        INSERT INTO student_cancellations
            (waitlist_id, name, surname, email, phone_number, course_id, amount_to_pay, extra_note, canceled_at, canceled_by)
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insert->execute([
        $name,
        $surname,
        $email,
        $phone,
        $courseId,
        $amountToPay,
        $extraNote ?: null,
        $canceledDateTime,
        $actor["id"] ?? null,
    ]);
    $cancellationId = (int)$conn->lastInsertId();

    record_audit_log(
        $conn,
        $actor,
        "waitlist",
        "temporary_canceled_student_added",
        "student_cancellations",
        $cancellationId,
        trim($name . " " . $surname),
        "Added temporary canceled student row for {$course['title']}",
        ["course_id" => $courseId, "amount_to_pay" => $amountToPay, "canceled_at" => $canceledDate]
    );

    echo json_encode(["success" => true, "id" => $cancellationId]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

