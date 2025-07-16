<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Step 1: Get professor by email
$stmt = $conn->prepare("SELECT * FROM professors WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "Email not found"
    ]);
    exit;
}

// Step 2: Verify password (assuming plain text for now)
if ($password !== $user['password']) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid password"
    ]);
    exit;
}

// Step 3: Get latest course for this professor
$courseStmt = $conn->prepare("
    SELECT course_id 
    FROM course_professor 
    WHERE professor_id = ? 
    ORDER BY enrolled_at DESC 
    LIMIT 1
");
$courseStmt->execute([$user['id']]);
$latestCourse = $courseStmt->fetch(PDO::FETCH_ASSOC);

// Step 4: Return response with latest course
echo json_encode([
    "success" => true,
    "user" => [
        "id" => $user['id'],
        "name" => $user['name'],
        "email" => $user['email'],
        "course_id" => $latestCourse['course_id'] ?? null
    ]
]);
