<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
include "audit_helpers.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);
$course_id = $data['id'] ?? 0;

if ($course_id) {
    try {
        $conn->beginTransaction();

        $courseStmt = $conn->prepare("SELECT title FROM courses WHERE id = ? LIMIT 1");
        $courseStmt->execute([$course_id]);
        $courseTitle = $courseStmt->fetchColumn() ?: "Course #{$course_id}";

        $conn->prepare("DELETE FROM student_payments WHERE course_id = ?")->execute([$course_id]);

        $conn->prepare("DELETE FROM course_student WHERE course_id = ?")->execute([$course_id]);

        $stmt = $conn->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$course_id]);

        $conn->commit();

        record_audit_log(
            $conn,
            $actor,
            "courses",
            "course_deleted",
            "course",
            $course_id,
            $courseTitle,
            "Deleted course {$courseTitle}",
            ["course_id" => $course_id]
        );

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Missing course ID"]);
}
?>
