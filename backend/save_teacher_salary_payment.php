<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
include "finance_helpers.php";

$data = finance_json_input();

try {
    $actor = finance_actor($conn, $data);
    ensure_finance_tables($conn);

    $teacherId = isset($data["teacher_id"]) ? (int)$data["teacher_id"] : 0;
    $courseId = isset($data["course_id"]) ? (int)$data["course_id"] : 0;
    $expectedRaw = trim((string)($data["expected_amount"] ?? ""));
    $expectedAmount = $expectedRaw === "" ? null : (float)$expectedRaw;
    $paidRaw = trim((string)($data["paid_amount"] ?? ""));
    $paidAmount = $paidRaw === "" ? -1 : (float)$paidRaw;
    $paymentDate = trim($data["payment_date"] ?? "");
    $notes = trim($data["notes"] ?? "");

    if ($teacherId < 1 || $courseId < 1 || $paidAmount < 0 || $paymentDate === "") {
        echo json_encode(["success" => false, "error" => "Mësimdh?nësi, kursi, shuma e paguar dhe data janë të detyrueshme."]);
        exit;
    }

    if ($expectedAmount !== null && $expectedAmount <= 0) {
        echo json_encode(["success" => false, "error" => "Shuma e plotë duhet të jetë më e madhe se 0 kur vendoset."]);
        exit;
    }

    $teacherStmt = $conn->prepare("SELECT name FROM professors WHERE id = ?");
    $teacherStmt->execute([$teacherId]);
    $teacherName = $teacherStmt->fetchColumn();

    $courseStmt = $conn->prepare("
        SELECT c.title
        FROM courses c
        LEFT JOIN course_professor cp ON cp.course_id = c.id
        WHERE c.id = ? AND (c.professor_id = ? OR cp.professor_id = ?)
        LIMIT 1
    ");
    $courseStmt->execute([$courseId, $teacherId, $teacherId]);
    $courseTitle = $courseStmt->fetchColumn();

    if (!$teacherName || !$courseTitle) {
        echo json_encode(["success" => false, "error" => "Mësimdh?nës ose kurs i pavlefsh?m për k?të mësimdh?nës."]);
        exit;
    }

    $expectedStmt = $conn->prepare("
        SELECT expected_amount
        FROM teacher_salary_payments
        WHERE teacher_id = ? AND course_id = ? AND expected_amount IS NOT NULL
        ORDER BY id DESC
        LIMIT 1
    ");
    $expectedStmt->execute([$teacherId, $courseId]);
    $previousExpected = $expectedStmt->fetchColumn();
    $effectiveExpected = $expectedAmount ?? ($previousExpected !== false ? (float)$previousExpected : null);

    $existingStmt = $conn->prepare("SELECT COALESCE(SUM(paid_amount), 0) FROM teacher_salary_payments WHERE teacher_id = ? AND course_id = ?");
    $existingStmt->execute([$teacherId, $courseId]);
    $alreadyPaid = (float)$existingStmt->fetchColumn();
    $totalPaidAfter = $alreadyPaid + $paidAmount;

    if ($effectiveExpected !== null && $paidAmount <= 0) {
        $remaining = $effectiveExpected;
        $status = "unpaid";
    } elseif ($effectiveExpected === null) {
        $remaining = 0;
        $status = $paidAmount > 0 ? "paid" : "unpaid";
    } else {
        $remaining = max($effectiveExpected - $totalPaidAfter, 0);

        if ($totalPaidAfter <= 0) {
            $status = "unpaid";
        } elseif ($totalPaidAfter < $effectiveExpected) {
            $status = "partially_paid";
        } else {
            $status = "paid";
        }
    }

    $stmt = $conn->prepare("
        INSERT INTO teacher_salary_payments
        (teacher_id, course_id, expected_amount, paid_amount, remaining_amount, status, payment_date, notes, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $teacherId,
        $courseId,
        $effectiveExpected,
        $paidAmount,
        $remaining,
        $status,
        $paymentDate,
        $notes ?: null,
        $actor["id"],
        $actor["id"],
    ]);
    $paymentId = (int)$conn->lastInsertId();

    record_audit_log(
        $conn,
        $actor,
        "teacher_salaries",
        "teacher_salary_payment_created",
        "teacher_salary_payment",
        $paymentId,
        $teacherName,
        "Registered teacher salary payment for {$teacherName} / {$courseTitle}",
        [
            "teacher_id" => $teacherId,
            "course_id" => $courseId,
            "expected_amount" => $effectiveExpected,
            "paid_amount" => $paidAmount,
            "remaining_amount" => $remaining,
            "status" => $status,
        ]
    );

    echo json_encode([
        "success" => true,
        "id" => $paymentId,
        "remaining_amount" => round($remaining, 2),
        "status" => $status,
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
