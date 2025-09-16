<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

// Show errors in dev
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Keep PHP & MySQL in UTC (optional)
date_default_timezone_set('UTC');
try { $conn->exec("SET time_zone = '+00:00'"); } catch (Throwable $e) {}

$data = json_decode(file_get_contents("php://input"), true);

// -------- Inputs --------
$course_id    = isset($data['id']) ? (int)$data['id'] : 0;
$title        = trim($data['title'] ?? '');
$description  = trim($data['description'] ?? '');
$professor_id = isset($data['professor_id']) ? (int)$data['professor_id'] : 0;
$student_ids  = is_array($data['student_ids'] ?? null) ? $data['student_ids'] : [];
$total_sessions = isset($data['training_hours']) ? max(1, (int)$data['training_hours']) : 0; // ← exactly what user typed

if (!$course_id || !$title || !$professor_id || $total_sessions < 1) {
  echo json_encode(["success" => false, "error" => "Missing required fields"]);
  exit;
}

try {
  $conn->beginTransaction();

  // 1) Update course core fields
  $stmt = $conn->prepare("UPDATE courses SET title = ?, description = ?, professor_id = ? WHERE id = ?");
  if (!$stmt->execute([$title, $description, $professor_id, $course_id])) {
    $err = $stmt->errorInfo();
    throw new Exception("Failed to update course: " . ($err[2] ?? 'unknown'));
  }

  // 2) Sync course_professor
  $conn->prepare("DELETE FROM course_professor WHERE course_id = ?")->execute([$course_id]);
  $stmtMap = $conn->prepare("INSERT INTO course_professor (course_id, professor_id) VALUES (?, ?)");
  $stmtMap->execute([$course_id, $professor_id]);

  // 3) Sync students
  $conn->prepare("DELETE FROM course_student WHERE course_id = ?")->execute([$course_id]);
  if (!empty($student_ids)) {
    $insStudent = $conn->prepare("INSERT INTO course_student (course_id, student_id) VALUES (?, ?)");
    foreach ($student_ids as $sid) {
      $insStudent->execute([$course_id, (int)$sid]);
    }
  }

  // 4) Adjust sessions to match EXACTLY $total_sessions
  // Current count
  $res = $conn->prepare("SELECT COUNT(*) AS cnt FROM training_sessions WHERE course_id = ?");
  $res->execute([$course_id]);
  $existing_count = (int)($res->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);

  // 4a) If reducing: delete trailing sessions (and their attendance first)
  if ($total_sessions < $existing_count) {
    $toDel = $conn->prepare("
      SELECT id FROM training_sessions
       WHERE course_id = ? AND session_number > ?
       ORDER BY session_number ASC
    ");
    $toDel->execute([$course_id, $total_sessions]);
    $ids = $toDel->fetchAll(PDO::FETCH_COLUMN, 0);

    if (!empty($ids)) {
      $in = implode(',', array_fill(0, count($ids), '?'));
      $conn->prepare("DELETE FROM attendance WHERE session_id IN ($in)")->execute($ids);
      $conn->prepare("DELETE FROM training_sessions WHERE id IN ($in)")->execute($ids);
    }
  }

  // Recount after deletions
  $res = $conn->prepare("SELECT COUNT(*) AS cnt FROM training_sessions WHERE course_id = ?");
  $res->execute([$course_id]);
  $existing_count = (int)($res->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);

  // 4b) If increasing: add new sessions after latest existing date (or from now)
  if ($total_sessions > $existing_count) {
    $maxDateStmt = $conn->prepare("SELECT MAX(session_date) AS max_date FROM training_sessions WHERE course_id = ?");
    $maxDateStmt->execute([$course_id]);
    $max_date_str = $maxDateStmt->fetch(PDO::FETCH_ASSOC)['max_date'] ?? null;

    $startDate = new DateTime('now', new DateTimeZone('UTC'));
    if ($max_date_str) {
      $maxDate = new DateTime($max_date_str, new DateTimeZone('UTC'));
      if ($maxDate >= $startDate) {
        $startDate = (clone $maxDate)->modify('+1 day');
      }
    }

    $ins = $conn->prepare("
      INSERT INTO training_sessions (course_id, session_number, session_title, session_date)
      VALUES (?, ?, ?, ?)
    ");

    for ($i = $existing_count + 1; $i <= $total_sessions; $i++) {
      $sessionDate = (clone $startDate)->modify('+' . ($i - ($existing_count + 1)) . ' days');

      // Initial title (will be normalized below anyway)
      $titleForThis = 'Session ' . max(1, $i - 1);
      if ($i === 1) $titleForThis = 'Sessioni Informues';
      if ($total_sessions >= 3 && $i >= $total_sessions - 1) $titleForThis = 'Extra Hours';

      $ins->execute([
        $course_id,
        $i,
        $titleForThis,
        $sessionDate->format('Y-m-d H:i:s'),
      ]);
    }
  }

  // 5) Normalize titles for ALL sessions to the current total
  // 5.1 Set everything from #2..#total to "Session {n-1}"
  if ($total_sessions >= 2) {
    $conn->prepare("
      UPDATE training_sessions
         SET session_title = CONCAT('Session ', session_number - 1)
       WHERE course_id = ? AND session_number BETWEEN 2 AND ?
    ")->execute([$course_id, $total_sessions]);
  }

  // 5.2 If total >= 3, last two are "Extra Hours"
  if ($total_sessions >= 3) {
    $conn->prepare("
      UPDATE training_sessions
         SET session_title = 'Extra Hours'
       WHERE course_id = ? AND session_number IN (?, ?)
    ")->execute([$course_id, $total_sessions - 1, $total_sessions]);
  }

  // 5.3 First session is always "Sessioni Informues" (override if needed)
  $conn->prepare("
    UPDATE training_sessions
       SET session_title = 'Sessioni Informues'
     WHERE course_id = ? AND session_number = 1
  ")->execute([$course_id]);

  $conn->commit();
  echo json_encode([
    "success" => true,
    "course_id" => $course_id,
    "total_sessions" => $total_sessions
  ]);

} catch (Exception $e) {
  $conn->rollBack();
  echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
