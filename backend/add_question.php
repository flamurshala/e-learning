<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user']) || !isset($data['question'])) {
    echo json_encode(["status" => "error", "message" => "Missing fields"]);
    exit;
}


$user = $data['user'];
$question = $data['question'];

try {
    $stmt = $conn->prepare("INSERT INTO questions (user, question) VALUES (:user, :question)");
    $stmt->bindParam(':user', $user);
    $stmt->bindParam(':question', $question);
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Question posted"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
