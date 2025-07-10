<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['question_id']) || !isset($data['user']) || !isset($data['reply'])) {
    echo json_encode(["status" => "error", "message" => "Missing fields"]);
    exit;
}

$question_id = $data['question_id'];
$user = $data['user'];
$reply = $data['reply'];

try {
    $stmt = $conn->prepare("INSERT INTO replies (question_id, user, reply) VALUES (:question_id, :user, :reply)");
    $stmt->bindParam(':question_id', $question_id);
    $stmt->bindParam(':user', $user);
    $stmt->bindParam(':reply', $reply);
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Reply added"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
