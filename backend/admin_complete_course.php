<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
require_once __DIR__ . "/audit_helpers.php";

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = [];
}

$courseId = isset($data["course_id"]) ? (int)$data["course_id"] : 0;
$actor = is_array($data["actor"] ?? null) ? $data["actor"] : [];
$actorId = isset($actor["id"]) ? (int)$actor["id"] : 0;

if ($courseId < 1 || $actorId < 1) {
    echo json_encode(["success" => false, "error" => "Mungon kursi ose përdoruesi administrator."]);
    exit;
}

try {
    $adminStmt = $conn->prepare("SELECT id, username, role FROM admins WHERE id = ? LIMIT 1");
    $adminStmt->execute([$actorId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !in_array($admin["role"], ["admin", "superadmin"], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Vet?m administratori ose superadministratori mund të përfundoj? kurset."]);
        exit;
    }

    $courseStmt = $conn->prepare("SELECT id, title, completed FROM courses WHERE id = ? LIMIT 1");
    $courseStmt->execute([$courseId]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["success" => false, "error" => "Kursi nuk u gjet."]);
        exit;
    }

    if ((int)$course["completed"] === 1) {
        echo json_encode(["success" => true, "message" => "Kursi është përfunduar tashmë."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE courses SET completed = 1 WHERE id = ?");
    $stmt->execute([$courseId]);

    record_audit_log(
        $conn,
        [
            "id" => (int)$admin["id"],
            "username" => $admin["username"],
            "role" => $admin["role"],
        ],
        "courses",
        "course_completed_by_admin",
        "course",
        $courseId,
        $course["title"],
        "Course marked as completed by admin.",
        ["forced" => true]
    );

    echo json_encode(["success" => true, "message" => "Kursi u sh?nua si i përfunduar."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
