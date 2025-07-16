<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["success" => false, "error" => "Missing ID"]);
    exit;
}

try {
    // Fetch main student info
    $stmt = $conn->prepare("SELECT * FROM students WHERE id = ?");
    $stmt->execute([$id]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["success" => false, "error" => "Student not found"]);
        exit;
    }

    // Fetch courses + payments
    $stmt = $conn->prepare("
        SELECT cs.course_id, sp.payment_method, sp.amount_all, sp.amount_month1, sp.amount_month2
        FROM course_student cs
        LEFT JOIN student_payments sp ON sp.student_id = cs.student_id AND sp.course_id = cs.course_id
        WHERE cs.student_id = ?
    ");
    $stmt->execute([$id]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $student['courses'] = $courses;

    echo json_encode($student);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
