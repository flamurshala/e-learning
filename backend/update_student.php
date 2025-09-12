<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include "db.php";

// Get data
$data = json_decode(file_get_contents("php://input"), true);

$student_id = $data['id'] ?? null;
$name = $data['name'] ?? '';
$surname = $data['surname'] ?? '';
$phoneNumber = $data['phoneNumber'] ?? '';
$email = $data['email'] ?? '';
$notes = $data['notes'] ?? '';

$courses = $data['courses'] ?? [];
$payments = $data['payments'] ?? [];
$amountPaidAll = $data['amountPaidAll'] ?? [];
$amountPaidMonth1 = $data['amountPaidMonth1'] ?? [];
$amountPaidMonth2 = $data['amountPaidMonth2'] ?? [];

if (!$student_id || !$name || !$email) {
    echo json_encode(["success" => false, "error" => "Missing core student data"]);
    exit;
}

try {
    $conn->beginTransaction();

    // Update core student info
    $stmt = $conn->prepare("UPDATE students SET name=?, surname=?, phone_number=?, email=?, notes=? WHERE id=?");
    $stmt->execute([$name, $surname, $phoneNumber, $email, $notes, $student_id]);

    // Remove existing courses and payments for this student
    $conn->prepare("DELETE FROM course_student WHERE student_id=?")->execute([$student_id]);
    $conn->prepare("DELETE FROM student_payments WHERE student_id=?")->execute([$student_id]);

    // Insert new course/payment entries
    for ($i = 0; $i < count($courses); $i++) {
        $courseId = $courses[$i];
        $method = $payments[$i] ?? '';
        $all = $amountPaidAll[$i] !== '' ? floatval($amountPaidAll[$i]) : null;
        $m1 = $amountPaidMonth1[$i] !== '' ? floatval($amountPaidMonth1[$i]) : null;
        $m2 = $amountPaidMonth2[$i] !== '' ? floatval($amountPaidMonth2[$i]) : null;

        // Insert into course_student
        $conn->prepare("INSERT INTO course_student (student_id, course_id) VALUES (?, ?)")
            ->execute([$student_id, $courseId]);

        // Insert into student_payments
        $conn->prepare("INSERT INTO student_payments (student_id, course_id, payment_method, amount_all, amount_month1, amount_month2)
            VALUES (?, ?, ?, ?, ?, ?)")
            ->execute([$student_id, $courseId, $method, $all, $m1, $m2]);
    }

    $conn->commit();
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
