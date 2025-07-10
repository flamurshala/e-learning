<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type");


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Only POST requests allowed"]);
    exit;
}

include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON input"]);
    exit;
}

$title = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$due_date = trim($data['due_date'] ?? '');
$professor_id = intval($data['professor_id'] ?? 0);
$course_id = intval($data['course_id'] ?? 0);


if ($title === '' || $description === '' || $due_date === '' || $professor_id === 0 || $course_id === 0) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

try {
    $sql = "INSERT INTO homeworks (title, description, due_date, professor_id, course_id)
            VALUES (:title, :description, :due_date, :professor_id, :course_id)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':due_date', $due_date);
    $stmt->bindParam(':professor_id', $professor_id, PDO::PARAM_INT);
    $stmt->bindParam(':course_id', $course_id, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(["status" => "success", "homework_id" => $conn->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
    