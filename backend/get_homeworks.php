<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "e-learning");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['student_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing student_id']);
        exit;
    }

    $student_id = $_GET['student_id'];

    // Get student's courses
    $coursesSql = "SELECT course_id FROM course_student WHERE student_id = ?";
    $stmt = $conn->prepare($coursesSql);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $coursesResult = $stmt->get_result();

    $courseIds = [];
    while ($row = $coursesResult->fetch_assoc()) {
        $courseIds[] = $row['course_id'];
    }

    if (count($courseIds) === 0) {
        echo json_encode(['status' => 'success', 'homeworks' => []]);
        exit;
    }

    // Get homeworks for those courses
    $inClause = implode(',', array_fill(0, count($courseIds), '?'));
    $homeworksSql = "SELECT * FROM homeworks WHERE course_id IN ($inClause)";
    $stmt = $conn->prepare($homeworksSql);
    $stmt->bind_param(str_repeat('i', count($courseIds)), ...$courseIds);
    $stmt->execute();
    $homeworksResult = $stmt->get_result();

    $homeworks = [];
    while ($row = $homeworksResult->fetch_assoc()) {
        $homeworks[] = $row;
    }

    echo json_encode(['status' => 'success', 'homeworks' => $homeworks]);
}
?>
