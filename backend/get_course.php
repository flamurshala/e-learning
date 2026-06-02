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

        // Fetch assigned professor IDs
        $stmtProfessors = $conn->prepare("SELECT professor_id FROM course_professor WHERE course_id = ?");
        $stmtProfessors->execute([$id]);
        $professorIds = $stmtProfessors->fetchAll(PDO::FETCH_COLUMN);

        if (empty($professorIds) && !empty($course['professor_id'])) {
            $professorIds = [$course['professor_id']];
        }

        // Fetch training hours (count of sessions)
        $stmtHours = $conn->prepare("SELECT COUNT(*) FROM training_sessions WHERE course_id = ?");
        $stmtHours->execute([$id]);
        $trainingHours = $stmtHours->fetchColumn();

        $course['student_ids'] = $studentIds;
        $course['professor_ids'] = $professorIds;
        $course['training_hours'] = $trainingHours;

        echo json_encode($course);
    } else {
        $activeOnly = isset($_GET['active_only']) && $_GET['active_only'] === '1';
        $query = "SELECT id, title FROM courses";
        if ($activeOnly) {
            $query .= " WHERE completed = 0 OR completed IS NULL";
        }
        $stmt = $conn->query($query);
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($courses);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
