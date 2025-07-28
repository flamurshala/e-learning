<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(["success" => false, "message" => "Username and password required"]);
    exit;
}

// Step 1: Fetch professor by username
$stmt = $conn->prepare("SELECT * FROM professors WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["success" => false, "message" => "Username not found"]);
    exit;
}

// Step 2: Verify password
if ($user['password'] !== $password) {
    echo json_encode(["success" => false, "message" => "Invalid password"]);
    exit;
}

// Step 3: Fetch latest course
$courseStmt = $conn->prepare("
    SELECT course_id 
    FROM course_professor 
    WHERE professor_id = ? 
    ORDER BY enrolled_at DESC 
    LIMIT 1
");
$courseStmt->execute([$user['id']]);
$latestCourse = $courseStmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    "success" => true,
    "user" => [
        "id" => $user['id'],
        "username" => $user['username'],
        "email" => $user['email'],
        "course_id" => $latestCourse['course_id'] ?? null
    ]
]);
