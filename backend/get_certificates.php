<?php
require_once('db.php');
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $stmt = $conn->prepare("
        SELECT c.certificate_id, c.file_path, c.created_at, 
               s.name AS student_name, cr.title AS course_name
        FROM certificates c
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN courses cr ON c.course_id = cr.id
        ORDER BY c.created_at DESC
    ");
    $stmt->execute();
    $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($certificates);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
