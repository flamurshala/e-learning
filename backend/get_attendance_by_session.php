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

$session_id = isset($_GET["session_id"]) ? (int)$_GET["session_id"] : 0;
$professor_id = isset($_GET["professor_id"]) ? (int)$_GET["professor_id"] : 0;

if ($session_id < 1 || $professor_id < 1) {
    echo json_encode([]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT a.student_id, a.status
        FROM attendance a
        INNER JOIN training_sessions ts ON ts.id = a.session_id
        INNER JOIN courses c ON c.id = ts.course_id
        LEFT JOIN course_professor cp ON cp.course_id = c.id
        WHERE a.session_id = ?
          AND (cp.professor_id = ? OR c.professor_id = ?)
        GROUP BY a.student_id, a.status
    ");
    $stmt->execute([$session_id, $professor_id, $professor_id]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
