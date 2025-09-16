<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

// ✅ Errors visible during dev
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ✅ Decode JSON
$data = json_decode(file_get_contents("php://input"), true);

// ✅ Required fields
$title        = $data['title'] ?? '';
$description  = $data['description'] ?? '';
$professor_id = isset($data['professor_id']) ? (int)$data['professor_id'] : 0;
$student_ids  = $data['student_ids'] ?? [];
$base_hours   = isset($data['training_hours']) ? max(1, (int)$data['training_hours']) : 0;

// ✅ Add 3 extra sessions: 1st info, last 2 extra hours
$extra_sessions = 3;
$total_sessions = $base_hours + $extra_sessions;

if (!$title || !$description || !$professor_id || $total_sessions < 1) {
  echo json_encode(['error' => 'Missing fields or invalid training hours']);
  exit;
}

try {
  $conn->beginTransaction();

  // Insert course
  $stmt = $conn->prepare("INSERT INTO courses (title, description, professor_id) VALUES (?, ?, ?)");
  $stmt->execute([$title, $description, $professor_id]);
  $course_id = (int)$conn->lastInsertId();

  // Map professor
  $stmt2 = $conn->prepare("INSERT INTO course_professor (course_id, professor_id) VALUES (?, ?)");
  $stmt2->execute([$course_id, $professor_id]);

  // Enroll students
  if (!empty($student_ids)) {
    $stmt3 = $conn->prepare("INSERT INTO course_student (course_id, student_id) VALUES (?, ?)");
    foreach ($student_ids as $sid) {
      $stmt3->execute([$course_id, (int)$sid]);
    }
  }

  // Create sessions (spaced 1 day apart as an example)
  $startDate = new DateTime('now', new DateTimeZone('UTC'));
  $stmt4 = $conn->prepare("
    INSERT INTO training_sessions (course_id, session_number, session_title, session_date)
    VALUES (?, ?, ?, ?)
  ");

  for ($i = 1; $i <= $total_sessions; $i++) {
    $sessionDate = clone $startDate;
    $sessionDate->modify('+' . ($i - 1) . ' days');

    // ✅ Title logic for EVERY session
    if ($i === 1) {
      // First session: Sessioni Informues
      $titleForThis = 'Sessioni Informues';
    } elseif ($i >= $total_sessions - 1) {
      // Last two sessions: Extra Hours
      $titleForThis = 'Extra Hours';
    } else {
      // Main sessions start counting from 1 right after the info session
      $titleForThis = 'Session ' . ($i - 1);
    }

    $stmt4->execute([
      $course_id,
      $i,                       // session_number (1..total_sessions)
      $titleForThis,            // session_title (always set)
      $sessionDate->format('Y-m-d H:i:s')
    ]);
  }

  $conn->commit();
  echo json_encode([
    'success' => true,
    'course_id' => $course_id,
    'total_sessions' => $total_sessions
  ]);

} catch (PDOException $e) {
  $conn->rollBack();
  echo json_encode(['error' => $e->getMessage()]);
}
