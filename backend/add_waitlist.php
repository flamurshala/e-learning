<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include "db.php";
include "audit_helpers.php";

$data = json_decode(file_get_contents("php://input"), true);
$actor = audit_actor_from_payload($data ?: []);

$name = trim($data["name"] ?? "");
$surname = trim($data["surname"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone_number"] ?? "");
$course_id = isset($data["course_id"]) ? (int) $data["course_id"] : 0;
$amount_to_pay = isset($data["amount_to_pay"]) && $data["amount_to_pay"] !== "" ? round((float)$data["amount_to_pay"], 2) : null;
$extra_note = trim($data["extra_note"] ?? "");

if (!$name || !$surname || !$email || !$phone || $course_id < 1) {
    echo json_encode(["success" => false, "error" => "Emri, mbiemri, emaili, telefoni dhe kursi janë të detyrueshme"]);
    exit;
}

try {
    $columns = $conn->query("SHOW COLUMNS FROM student_waitlist")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array("amount_to_pay", $columns, true)) {
        $conn->exec("ALTER TABLE student_waitlist ADD COLUMN amount_to_pay DECIMAL(10,2) DEFAULT NULL AFTER course_id");
    }

    $chk = $conn->prepare("SELECT id, title FROM courses WHERE id = ? AND (completed = 0 OR completed IS NULL)");
    $chk->execute([$course_id]);
    $course = $chk->fetch(PDO::FETCH_ASSOC);
    if (!$course) {
        echo json_encode(["success" => false, "error" => "Kurs i pavlefsh?m ose i përfunduar"]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO student_waitlist (name, surname, email, phone_number, course_id, amount_to_pay, extra_note) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$name, $surname, $email, $phone, $course_id, $amount_to_pay, $extra_note ?: null]);
    $waitlistId = (int) $conn->lastInsertId();
    record_audit_log(
        $conn,
        $actor,
        "waitlist",
        "waitlist_added",
        "student_waitlist",
        $waitlistId,
        trim($name . " " . $surname),
        "Added student to waitlist for {$course['title']}",
        ["course_id" => $course_id, "amount_to_pay" => $amount_to_pay]
    );
    echo json_encode(["success" => true, "id" => $waitlistId]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
