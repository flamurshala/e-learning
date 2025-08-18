<?php
require_once('db.php');

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$certificate_id = $_GET['id'] ?? null;

if (!$certificate_id) {
    echo json_encode(['error' => 'Missing certificate ID']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT c.*, 
               s.name AS student_name, 
               co.title AS course_name
        FROM certificates c
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN courses co ON c.course_id = co.id
        WHERE c.certificate_id = ?
        LIMIT 1
    ");
    $stmt->execute([$certificate_id]);
    $certificate = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($certificate) {
        echo json_encode($certificate);
    } else {
        echo json_encode(['error' => 'Certificate not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
