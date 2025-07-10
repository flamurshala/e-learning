<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

// If you're passing it via query string (e.g. ?id=20), use this:
$student_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($student_id > 0) {
    try {
        $stmt = $conn->prepare("SELECT name FROM students WHERE id = ?");
        $stmt->execute([$student_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            echo json_encode(["name" => $row['name']]);
        } else {
            echo json_encode(["error" => "Student not found"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => "DB error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "No ID provided"]);
}
