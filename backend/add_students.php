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

    $name = trim($data['name'] ?? '');
    $phone = trim($data['phoneNumber'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $payments = $data['payments'] ?? '';
    $courses = $data['courses'] ?? [];

    $amountAll = $data['amountPaidAll'] ?? null;
    $amountMonth1 = $data['amountPaidMonth1'] ?? null;
    $amountMonth2 = $data['amountPaidMonth2'] ?? null;

    if (!$name || !$phone || !$email || !$password || !$payments || empty($courses) || !is_array($courses)) {
        echo json_encode(['success' => false, 'error' => 'Missing fields or courses']);
        exit;
    }


    $conn->beginTransaction();

    $stmt = $conn->prepare("INSERT INTO students (name, phone_number, email, password) VALUES (?, ?, ?, ?)");
    $result = $stmt->execute([$name, $phone, $email, $password]);

    if (!$result) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => 'Error inserting student']);
        exit;
    }

    $student_id = $conn->lastInsertId();

    $stmtEnroll = $conn->prepare("INSERT INTO course_student (student_id, course_id) VALUES (?, ?)");

    $stmtPayment = $conn->prepare("INSERT INTO student_payments (student_id, course_id, payment_method, amount_all, amount_month1, amount_month2) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($courses as $course_id) {
        $stmtEnroll->execute([$student_id, $course_id]);

        $stmtPayment->execute([
            $student_id,
            $course_id,
            $payments,
            $payments === 'All' ? $amountAll : null,
            $payments === 'Divided' ? $amountMonth1 : null,
            $payments === 'Divided' ? $amountMonth2 : null,
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
