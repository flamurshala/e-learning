<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";

$course_id = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;

if ($course_id < 1) {
    echo json_encode(["error" => "ID e kursit është e detyrueshme"]);
    exit;
}

try {
    $courseStmt = $conn->prepare("SELECT id, title FROM courses WHERE id = ? LIMIT 1");
    $courseStmt->execute([$course_id]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["error" => "Kursi nuk u gjet"]);
        exit;
    }

    $sql = "
        SELECT
            s.id AS student_id,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,
            (
                SELECT COUNT(*)
                FROM training_sessions ts
                WHERE ts.course_id = ? AND ts.submitted_at IS NOT NULL
            ) AS total_sessions,
            (
                SELECT COUNT(*)
                FROM attendance a
                INNER JOIN training_sessions ats ON ats.id = a.session_id
                WHERE ats.course_id = ?
                  AND ats.submitted_at IS NOT NULL
                  AND a.student_id = s.id
                  AND a.status IN ('present', 'online')
            ) AS attended_sessions
        FROM course_student cs
        INNER JOIN students s ON s.id = cs.student_id
        WHERE cs.course_id = ?
        GROUP BY s.id, s.name, s.surname
        ORDER BY s.name ASC, s.surname ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$course_id, $course_id, $course_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $students = array_map(function ($student) {
        $total = (int)$student["total_sessions"];
        $attended = (int)$student["attended_sessions"];
        $student["total_sessions"] = $total;
        $student["attended_sessions"] = $attended;
        $student["attendance_percentage"] = $total > 0 ? round(($attended / $total) * 100, 2) : 0;
        return $student;
    }, $students);

    echo json_encode([
        "success" => true,
        "course" => $course,
        "students" => $students,
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
