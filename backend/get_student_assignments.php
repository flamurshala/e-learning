<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php';

// Get course_id from query parameter
$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

// Validate
if (!$course_id) {
    echo json_encode(["error" => "Course ID is required"]);
    exit;
}

try {
    // Fetch assignments for the given course
    $stmt = $conn->prepare("SELECT * FROM assignments WHERE course_id = ?");
    $stmt->execute([$course_id]);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($assignments);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
