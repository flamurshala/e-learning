<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    // Fetch all students (include surname and personal_number if needed)
    $stmtStudents = $conn->query("SELECT id, name, surname, email, phone_number FROM students");
    $students = $stmtStudents->fetchAll(PDO::FETCH_ASSOC);

    foreach ($students as &$student) {
        // Get courses and payment info per student
        $stmtCourses = $conn->prepare("
            SELECT 
                c.title,
                sp.payment_method,
                sp.amount_all,
                sp.amount_month1,
                sp.amount_month2
            FROM courses c
            JOIN course_student cs ON cs.course_id = c.id
            LEFT JOIN student_payments sp 
                ON sp.student_id = cs.student_id AND sp.course_id = cs.course_id
            WHERE cs.student_id = ?
        ");
        $stmtCourses->execute([$student['id']]);
        $student['courses'] = $stmtCourses->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    echo json_encode($students);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
