<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

function certificate_file_slug(string $name): string {
    $name = trim($name);

    if (function_exists('iconv')) {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        if ($ascii !== false) {
            $name = $ascii;
        }
    }

    $name = preg_replace('/[^A-Za-z0-9._-]+/', '-', $name);
    $name = trim($name, '-._');

    return $name !== '' ? $name : 'merged-certificates';
}

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

    $mergedCertificateFile = certificate_file_slug($course['title'] ?? '') . '.pdf';
    $mergedCertificatePath = __DIR__ . '/certificates/' . $mergedCertificateFile;
    $course['merged_certificate_file'] = file_exists($mergedCertificatePath) ? $mergedCertificateFile : null;
}

echo json_encode($courses);
