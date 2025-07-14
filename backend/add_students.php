<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include "db.php";

try {
    $data = json_decode(file_get_contents("php://input"), true);

    // Student info
    $name = trim($data['name'] ?? '');
    $surname = trim($data['surname'] ?? '');
    $phone = trim($data['phoneNumber'] ?? '');
    $personalNumber = trim($data['personalNumber'] ?? '');
    $email = trim($data['email'] ?? '');
    $notes = trim($data['notes'] ?? '');
    
    // Course & payment
    $courses = $data['courses'] ?? [];
    $payments = $data['payments'] ?? [];
    $amountAll = $data['amountPaidAll'] ?? [];
    $amountMonth1 = $data['amountPaidMonth1'] ?? [];
    $amountMonth2 = $data['amountPaidMonth2'] ?? [];

    if (!$name || !$surname || !$phone || !$personalNumber || !$email || empty($courses)) {
        echo json_encode(['success' => false, 'error' => 'Missing fields or courses']);
        exit;
    }

    $conn->beginTransaction();

    $stmt = $conn->prepare("INSERT INTO students (name, surname, phone_number, personal_number, email, notes) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $surname, $phone, $personalNumber, $email, $notes]);

    $student_id = $conn->lastInsertId();

    $stmtEnroll = $conn->prepare("INSERT INTO course_student (student_id, course_id) VALUES (?, ?)");
    $stmtPayment = $conn->prepare("INSERT INTO student_payments (student_id, course_id, payment_method, amount_all, amount_month1, amount_month2) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($courses as $i => $course_id) {
        $paymentMethod = $payments[$i] ?? '';
        $all = $amountAll[$i] ?? null;
        $m1 = $amountMonth1[$i] ?? null;
        $m2 = $amountMonth2[$i] ?? null;

        $stmtEnroll->execute([$student_id, $course_id]);
        $stmtPayment->execute([
            $student_id,
            $course_id,
            $paymentMethod,
            $paymentMethod === 'All' ? $all : null,
            $paymentMethod === 'Divided' ? $m1 : null,
            $paymentMethod === 'Divided' ? $m2 : null,
        ]);
    }

    $conn->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
