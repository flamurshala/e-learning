<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include 'db.php';

$question_id = $_GET['question_id'] ?? null;

if (!$question_id) {
    echo json_encode(["status" => "error", "message" => "Missing question_id"]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT * FROM replies WHERE question_id = :question_id ORDER BY created_at ASC");
    $stmt->bindParam(':question_id', $question_id);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($results);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
