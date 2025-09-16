<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
include 'db.php';

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$course_id) {
    echo json_encode(['error' => 'Course ID is required']);
    exit;
}

try {
    // Keep MySQL session in UTC (optional)
    try { $conn->exec("SET time_zone = '+00:00'"); } catch (Throwable $e) {}

    // Join a tiny subquery to know the max session number for this course
    // so we can compute a fallback name if session_title is NULL.
    $sql = "
        SELECT
            a.id                                        AS attendance_id,
            a.session_id,
            a.student_id,
            a.status,

            -- ✅ include raw name & surname
            s.name                                      AS name,
            s.surname                                   AS surname,

            -- ✅ full name (preferred by UI)
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,

            ts.session_number,

            -- ✅ session title: use stored title, else compute
            COALESCE(
              ts.session_title,
              CASE
                WHEN ts.session_number = 1 THEN 'Sessioni Informues'
                WHEN ts.session_number >= (mx.max_sn - 1) THEN 'Extra Hours'
                ELSE NULL
              END
            )                                            AS session_title,

            DATE_FORMAT(ts.session_date,  '%Y-%m-%d %H:%i:%s') AS session_date,
            DATE_FORMAT(ts.submitted_at, '%Y-%m-%d %H:%i:%s') AS submitted_at,
            ts.submitted_after_seconds
        FROM training_sessions ts
        JOIN (
            SELECT course_id, MAX(session_number) AS max_sn
            FROM training_sessions
            WHERE course_id = ?
            GROUP BY course_id
        ) mx ON mx.course_id = ts.course_id
        LEFT JOIN attendance a ON a.session_id = ts.id
        LEFT JOIN students   s ON s.id = a.student_id
        WHERE ts.course_id = ?
        ORDER BY ts.session_number ASC, s.name ASC, s.surname ASC, a.id ASC
    ";

    // Note: course_id is used twice (subquery + WHERE)
    $stmt = $conn->prepare($sql);
    $stmt->execute([$course_id, $course_id]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($attendance ?: []);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
