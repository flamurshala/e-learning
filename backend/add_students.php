<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

include "db.php";

try {
    $isTemporaryStudentRegistration = !empty($temporaryStudentRegistration);
    $data = json_decode(file_get_contents("php://input"), true);

    // Student info
    $name = trim($data['name'] ?? '');
    $surname = trim($data['surname'] ?? '');
    $phone = trim($data['phoneNumber'] ?? '');
    $email = trim($data['email'] ?? '');
    $notes = trim($data['notes'] ?? '');
    $registrationDate = trim($data['registrationDate'] ?? '');
    $registrationDateTime = null;

    if ($isTemporaryStudentRegistration && $registrationDate === '') {
        echo json_encode(['success' => false, 'error' => 'Registration date is required']);
        exit;
    }

    if ($registrationDate !== '') {
        $date = DateTime::createFromFormat('Y-m-d', $registrationDate);
        $dateErrors = DateTime::getLastErrors();
        if (
            !$date ||
            ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0))
        ) {
            echo json_encode(['success' => false, 'error' => 'Invalid registration date']);
            exit;
        }

        $registrationDateTime = $date->format('Y-m-d') . ' 00:00:00';
    }
    
    // Course & payment
    $courses = $data['courses'] ?? [];
    $payments = $data['payments'] ?? [];
    $amountAll = $data['amountPaidAll'] ?? [];
    $amountMonth1 = $data['amountPaidMonth1'] ?? [];
    $amountMonth2 = $data['amountPaidMonth2'] ?? [];
    $allowedPaymentMethods = ['Bank', 'All', 'Divided', 'POS', 'Cash', 'Did not pay', 'Free'];

    if (!$name || !$surname || !$phone  || !$email || empty($courses)) {
        echo json_encode(['success' => false, 'error' => 'Missing fields or courses']);
        exit;
    }

    foreach (['student_payments', 'student_course_payments'] as $paymentTable) {
        try {
            $conn->exec("ALTER TABLE `$paymentTable` MODIFY `payment_method` ENUM('Bank','All','Divided','POS','Cash','Did not pay','Free') NOT NULL");
        } catch (PDOException $ignored) {
            // Keep registration working even if an older optional table is missing.
        }
    }

    $conn->beginTransaction();

    $stmtExistingStudent = $conn->prepare("SELECT id, notes FROM students WHERE LOWER(email) = LOWER(?) LIMIT 1");
    $stmtExistingStudent->execute([$email]);
    $existingStudent = $stmtExistingStudent->fetch(PDO::FETCH_ASSOC);
    $mergedExisting = false;

    if ($existingStudent) {
        $student_id = (int) $existingStudent['id'];
        $mergedExisting = true;

        $existingNotes = trim($existingStudent['notes'] ?? '');
        $mergedNotes = $existingNotes;
        if ($notes !== '' && strpos($existingNotes, $notes) === false) {
            $mergedNotes = trim($existingNotes . "\n\n" . $notes);
        }

        $stmtUpdateStudent = $conn->prepare("UPDATE students SET name = ?, surname = ?, phone_number = ?, notes = ? WHERE id = ?");
        $stmtUpdateStudent->execute([$name, $surname, $phone, $mergedNotes, $student_id]);
    } else {
        $stmt = $conn->prepare("INSERT INTO students (name, surname, phone_number, email, notes) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $surname, $phone, $email, $notes]);

        $student_id = (int) $conn->lastInsertId();
    }

    $stmtExistingCourses = $conn->prepare("SELECT course_id FROM course_student WHERE student_id = ?");
    $stmtExistingCourses->execute([$student_id]);
    $existingCourseIds = array_map('strval', $stmtExistingCourses->fetchAll(PDO::FETCH_COLUMN));

    $stmtEnroll = $registrationDateTime
        ? $conn->prepare("INSERT INTO course_student (student_id, course_id, enrolled_at) VALUES (?, ?, ?)")
        : $conn->prepare("INSERT INTO course_student (student_id, course_id) VALUES (?, ?)");
    $stmtPayment = $registrationDateTime
        ? $conn->prepare("INSERT INTO student_payments (student_id, course_id, payment_method, amount_all, amount_month1, amount_month2, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        : $conn->prepare("INSERT INTO student_payments (student_id, course_id, payment_method, amount_all, amount_month1, amount_month2) VALUES (?, ?, ?, ?, ?, ?)");
    $addedCourseIds = [];
    $skippedCourseIds = [];
    $warnings = [];
    $seenCourseIds = [];

    foreach ($courses as $i => $course_id) {
        $courseId = trim((string) $course_id);
        if ($courseId === '') {
            throw new Exception('Invalid course');
        }

        $paymentMethod = $payments[$i] ?? '';
        if (!in_array($paymentMethod, $allowedPaymentMethods, true)) {
            throw new Exception('Invalid payment method');
        }

        if (in_array($courseId, $seenCourseIds, true)) {
            $skippedCourseIds[] = $courseId;
            $warnings[] = 'Duplicate course selection was skipped.';
            continue;
        }

        $seenCourseIds[] = $courseId;

        if (in_array($courseId, $existingCourseIds, true)) {
            $skippedCourseIds[] = $courseId;
            $warnings[] = 'A selected course was already registered for this student and was skipped.';
            continue;
        }

        $all = $amountAll[$i] ?? null;
        $m1 = $amountMonth1[$i] ?? null;
        $m2 = $amountMonth2[$i] ?? null;

        if ($registrationDateTime) {
            $stmtEnroll->execute([$student_id, $courseId, $registrationDateTime]);
        } else {
            $stmtEnroll->execute([$student_id, $courseId]);
        }

        $paymentParams = [
            $student_id,
            $courseId,
            $paymentMethod,
            in_array($paymentMethod, ['Bank', 'All', 'POS', 'Cash'], true) ? $all : null,
            $paymentMethod === 'Divided' ? $m1 : null,
            $paymentMethod === 'Divided' ? $m2 : null,
        ];

        if ($registrationDateTime) {
            $paymentParams[] = $registrationDateTime;
        }

        $stmtPayment->execute($paymentParams);

        $addedCourseIds[] = $courseId;
        $existingCourseIds[] = $courseId;
    }

    $conn->commit();
    echo json_encode([
        'success' => true,
        'student_id' => $student_id,
        'merged_existing' => $mergedExisting,
        'added_course_ids' => $addedCourseIds,
        'skipped_course_ids' => $skippedCourseIds,
        'warnings' => array_values(array_unique($warnings)),
    ]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
