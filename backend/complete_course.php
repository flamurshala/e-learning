<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'db.php'; // your DB connection file

$data = json_decode(file_get_contents('php://input'), true);

$course_id = $data['course_id'] ?? null;

if (!$course_id) {
    echo json_encode(['success' => false, 'error' => 'Missing course_id']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE courses SET completed = 1 WHERE id = :id");
    $stmt->bindParam(':id', $course_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update course']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
