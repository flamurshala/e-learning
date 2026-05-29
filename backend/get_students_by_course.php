<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include 'db.php';

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$course_id) {
    echo json_encode(['error' => 'Missing course_id']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            s.id,
            s.name,
            s.surname,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,
            (
                SELECT COUNT(*)
                FROM training_sessions ts
                WHERE ts.course_id = cs.course_id
                  AND ts.submitted_at IS NOT NULL
            ) AS total_sessions,
            (
                SELECT COUNT(*)
                FROM attendance a
                INNER JOIN training_sessions ats ON ats.id = a.session_id
                WHERE ats.course_id = cs.course_id
                  AND ats.submitted_at IS NOT NULL
                  AND a.student_id = s.id
                  AND a.status IN ('present', 'online')
            ) AS attended_sessions
        FROM course_student cs
        INNER JOIN students s ON s.id = cs.student_id
        WHERE cs.course_id = ?
        ORDER BY s.name ASC, s.surname ASC
    ");
    $stmt->execute([$course_id]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($rows as &$row) {
        $total = (int)($row['total_sessions'] ?? 0);
        $attended = (int)($row['attended_sessions'] ?? 0);

        $row['total_sessions'] = $total;
        $row['attended_sessions'] = $attended;
        $row['attendance_percentage'] = $total > 0 ? round(($attended / $total) * 100, 2) : 0;
    }

    echo json_encode($rows);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
