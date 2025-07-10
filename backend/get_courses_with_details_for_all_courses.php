<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

// Get all courses that are not completed with professor names
$sql = "
  SELECT c.id, c.title, c.description, c.completed, c.professor_id, p.name AS professor_name
  FROM courses c
  LEFT JOIN professors p ON c.professor_id = p.id
  WHERE c.completed = 0
";
$stmt = $conn->prepare($sql);
$stmt->execute();
$courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

// For each course, get enrolled students (names)
foreach ($courses as &$course) {
    $courseId = $course['id'];
    $studentSql = "
      SELECT s.name
      FROM students s
      JOIN course_student sc ON s.id = sc.student_id
      WHERE sc.course_id = ?
    ";
    $studentStmt = $conn->prepare($studentSql);
    $studentStmt->execute([$courseId]);
    $students = $studentStmt->fetchAll(PDO::FETCH_COLUMN); // fetch student names only
    $course['students'] = $students;
}

echo json_encode($courses);
