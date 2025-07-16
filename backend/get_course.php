<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    if (isset($_GET['id'])) {
        $id = $_GET['id'];

        // Fetch course info
        $stmt = $conn->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        $course = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$course) {
            echo json_encode(["error" => "Course not found"]);
            exit;
        }

        // Fetch student IDs
        $stmtStudents = $conn->prepare("SELECT student_id FROM course_student WHERE course_id = ?");
        $stmtStudents->execute([$id]);
        $studentIds = $stmtStudents->fetchAll(PDO::FETCH_COLUMN);

        // Fetch training hours (count of sessions)
        $stmtHours = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ?");
        $stmtHours->execute([$id]);
        $trainingHours = $stmtHours->fetchColumn();

        $course['student_ids'] = $studentIds;
        $course['training_hours'] = $trainingHours;

        echo json_encode($course);
    } else {
        $stmt = $conn->query("SELECT id, title FROM courses");
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($courses);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
