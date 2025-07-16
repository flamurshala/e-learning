<?php
header(header: 'Access-Control-Allow-Origin: *');
header(header: 'Content-Type: application/json');
header(header: "Access-Control-Allow-Headers: Content-Type");

include "db.php";

$data = json_decode(json: file_get_contents(filename: "php://input"), associative: true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Optional: Debug log — remove in production
// file_put_contents('debug_log.txt', "Email received: $email\nPassword received: $password\n", FILE_APPEND);

$stmt = $conn->prepare(query: "SELECT * FROM professors WHERE email = ?");
$stmt->execute(params: [$email]);
$user = $stmt->fetch( PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(value: [
        "success" => false,
        "message" => "Email not found"
    ]);
    exit;
}

if ($password === $user['password']) {
    // Get default course for the professor
    $stmtCourse = $conn->prepare("SELECT id FROM courses WHERE professor_id = ? LIMIT 1");
    $stmtCourse->execute([$user['id']]);
    $course = $stmtCourse->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "course_id" => $course['id'] ?? null  // send course_id if available
        ]
    ]);
}
 else {
    echo json_encode(value: [
        "success" => false,
        "message" => "Invalid password"
    ]);
}