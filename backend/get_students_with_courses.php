<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'db.php';

try {
    $stmt = $conn->query("
        SELECT 
            s.id AS student_id,
            s.name,
            s.email,
            s.password,
            s.phone_number,
            c.title AS course_title
        FROM students s
        LEFT JOIN course_student cs ON s.id = cs.student_id
        LEFT JOIN courses c ON cs.course_id = c.id
    ");

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group by student_id
    $students = [];
    foreach ($data as $row) {
        $id = $row['student_id'];
        if (!isset($students[$id])) {
            $students[$id] = [
                'id' => $id,
                'name' => $row['name'],
                'email' => $row['email'],
                'password' => $row['password'],
                'phone' => $row['phone_number'], // <-- Add phone here
                'courses' => [],
            ];
        }

        if ($row['course_title']) {
            $students[$id]['courses'][] = $row['course_title'];
        }
    }

    // Re-index array
    $students = array_values($students);
    echo json_encode($students);

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
