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

$professor_id = isset($_GET["professor_id"]) ? (int)$_GET["professor_id"] : 0;
$course_id = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;

if ($professor_id < 1) {
    echo json_encode(["error" => "ID e profesorit është e detyrueshme"]);
    exit;
}

try {
    $where = [
        "(cp.professor_id = ? OR c.professor_id = ?)",
    ];
    $params = [$professor_id, $professor_id];

    if ($course_id > 0) {
        $where[] = "c.id = ?";
        $params[] = $course_id;
    }

    $sql = "
        SELECT
            s.id AS student_id,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,
            c.id AS course_id,
            c.title AS course_title,
            (
                SELECT COUNT(*)
                FROM training_sessions ts
                WHERE ts.course_id = c.id AND ts.submitted_at IS NOT NULL
            ) AS total_sessions,
            (
                SELECT COUNT(*)
                FROM attendance a
                INNER JOIN training_sessions ats ON ats.id = a.session_id
                WHERE ats.course_id = c.id
                  AND ats.submitted_at IS NOT NULL
                  AND a.student_id = s.id
                  AND a.status IN ('present', 'online')
            ) AS attended_sessions
        FROM course_student cs
        INNER JOIN students s ON s.id = cs.student_id
        INNER JOIN courses c ON c.id = cs.course_id
        LEFT JOIN course_professor cp ON cp.course_id = c.id
        WHERE " . implode(" AND ", $where) . "
        GROUP BY s.id, s.name, s.surname, c.id, c.title
        ORDER BY c.title ASC, s.name ASC, s.surname ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rows = array_map(function ($row) {
        $total = (int)$row["total_sessions"];
        $attended = (int)$row["attended_sessions"];
        $row["total_sessions"] = $total;
        $row["attended_sessions"] = $attended;
        $row["attendance_percentage"] = $total > 0 ? round(($attended / $total) * 100, 2) : 0;
        return $row;
    }, $rows);

    echo json_encode($rows);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
