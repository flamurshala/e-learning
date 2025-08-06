<?php
require_once('db.php');
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $stmt = $conn->prepare("
       SELECT c.*, s.name AS student_name, co.title AS course_name
FROM certificates c
LEFT JOIN students s ON c.student_id = s.id
LEFT JOIN courses co ON c.course_id = co.id
ORDER BY c.id DESC

    ");
    $stmt->execute();
    $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($certificates);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
