<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include 'db.php';

try {
    $stmt = $conn->prepare("SELECT * FROM questions ORDER BY id DESC");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($results);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
