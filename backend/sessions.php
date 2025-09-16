<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$course_id) {
    echo json_encode(["error" => "Missing course_id"]);
    exit;
}

try {
    // optional but recommended: keep SQL session in UTC
    try { $conn->exec("SET time_zone = '+00:00'"); } catch (Throwable $e) {}

    $sql = "
        SELECT
            ts.id,
            ts.session_number,
            DATE_FORMAT(ts.session_date, '%Y-%m-%d %H:%i:%s') AS session_date,
            -- use stored name if present; otherwise compute a default
            COALESCE(
                ts.session_title,
                CASE
                    WHEN ts.session_number = 1 THEN 'Sessioni Informues'
                    WHEN ts.session_number >= (mx.max_sn - 1) THEN 'Extra Hours'
                    ELSE NULL
                END
            ) AS session_title
        FROM training_sessions ts
        JOIN (
            SELECT course_id, MAX(session_number) AS max_sn
            FROM training_sessions
            WHERE course_id = ?
            GROUP BY course_id
        ) mx ON mx.course_id = ts.course_id
        WHERE ts.course_id = ?
        ORDER BY ts.session_number ASC
    ";

    // note: course_id bound twice (subquery + main WHERE)
    $stmt = $conn->prepare($sql);
    $stmt->execute([$course_id, $course_id]);
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($sessions ?: []);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
