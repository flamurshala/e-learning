<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
include "audit_helpers.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);
$actorId = isset($actor['id']) ? (int)$actor['id'] : 0;
$course_id = isset($data['id']) ? (int)$data['id'] : 0;

if ($course_id && $actorId) {
    try {
        $adminStmt = $conn->prepare("SELECT id, username, role FROM admins WHERE id = ? LIMIT 1");
        $adminStmt->execute([$actorId]);
        $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin || !in_array($admin["role"], ["admin", "superadmin"], true)) {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "Only an admin or superadmin can delete courses"]);
            exit;
        }

        $conn->beginTransaction();

        $courseStmt = $conn->prepare("SELECT title, completed FROM courses WHERE id = ? LIMIT 1 FOR UPDATE");
        $courseStmt->execute([$course_id]);
        $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

        if (!$course) {
            $conn->rollBack();
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Course not found"]);
            exit;
        }

        if ((int)$course["completed"] === 1) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "error" => "Completed courses must be deleted from the Completed Courses page",
            ]);
            exit;
        }

        $courseTitle = $course["title"];
        $actor = [
            "id" => (int)$admin["id"],
            "username" => $admin["username"],
            "role" => $admin["role"],
        ];

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
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing course ID or administrator"]);
}
?>
