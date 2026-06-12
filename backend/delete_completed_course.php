<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
    exit;
}

include "db.php";
require_once __DIR__ . "/audit_helpers.php";

function delete_course_rows_if_table_exists(PDO $conn, string $table, int $courseId): void {
    $allowedTables = ["student_course_payments"];
    if (!in_array($table, $allowedTables, true)) {
        throw new InvalidArgumentException("Unsupported course relationship table");
    }

    $tableStmt = $conn->prepare("
        SELECT COUNT(*)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    ");
    $tableStmt->execute([$table]);

    if ((int)$tableStmt->fetchColumn() === 1) {
        $conn->prepare("DELETE FROM `{$table}` WHERE course_id = ?")->execute([$courseId]);
    }
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = [];
}

$courseId = isset($data["course_id"]) ? (int)$data["course_id"] : 0;
$actor = is_array($data["actor"] ?? null) ? $data["actor"] : [];
$actorId = isset($actor["id"]) ? (int)$actor["id"] : 0;

if ($courseId < 1 || $actorId < 1) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Course ID and administrator are required"]);
    exit;
}

try {
    $adminStmt = $conn->prepare("SELECT id, username, role FROM admins WHERE id = ? LIMIT 1");
    $adminStmt->execute([$actorId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !in_array($admin["role"], ["admin", "superadmin"], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Only an admin or superadmin can delete completed courses"]);
        exit;
    }

    $conn->beginTransaction();

    $courseStmt = $conn->prepare("
        SELECT id, title, completed
        FROM courses
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
    ");
    $courseStmt->execute([$courseId]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Course not found"]);
        exit;
    }

    if ((int)$course["completed"] !== 1) {
        $conn->rollBack();
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "Only completed courses can be deleted here"]);
        exit;
    }

    // These relationships do not all cascade in the existing schema.
    $conn->prepare("DELETE FROM student_payments WHERE course_id = ?")->execute([$courseId]);
    delete_course_rows_if_table_exists($conn, "student_course_payments", $courseId);
    $conn->prepare("DELETE FROM student_progress WHERE course_id = ?")->execute([$courseId]);
    $conn->prepare("DELETE FROM course_student WHERE course_id = ?")->execute([$courseId]);

    // Remaining course-owned rows use their existing ON DELETE behavior.
    $deleteCourse = $conn->prepare("DELETE FROM courses WHERE id = ?");
    $deleteCourse->execute([$courseId]);

    if ($deleteCourse->rowCount() !== 1) {
        throw new RuntimeException("The course could not be deleted");
    }

    $conn->commit();

    try {
        record_audit_log(
            $conn,
            [
                "id" => (int)$admin["id"],
                "username" => $admin["username"],
                "role" => $admin["role"],
            ],
            "courses",
            "completed_course_deleted",
            "course",
            $courseId,
            $course["title"],
            "Deleted completed course and its related student payments.",
            ["course_id" => $courseId]
        );
    } catch (Throwable $ignored) {
        // The completed deletion has already committed; audit failure must not report it as failed.
    }

    echo json_encode([
        "success" => true,
        "message" => "Course and related payments deleted successfully",
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to delete the completed course",
    ]);
}
