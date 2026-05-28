<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include "db.php";
include "audit_helpers.php";

$data = json_decode(file_get_contents("php://input"), true);
$actor = audit_actor_from_payload($data ?: []);
$id = isset($data["id"]) ? (int) $data["id"] : 0;

if ($id < 1) {
    echo json_encode(["success" => false, "error" => "ID e pavlefshme"]);
    exit;
}

try {
    $lookup = $conn->prepare("
        SELECT w.*, c.title AS course_title
        FROM student_waitlist w
        LEFT JOIN courses c ON c.id = w.course_id
        WHERE w.id = ?
    ");
    $lookup->execute([$id]);
    $entry = $lookup->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("DELETE FROM student_waitlist WHERE id = ?");
    $stmt->execute([$id]);
    if ($entry) {
        record_audit_log(
            $conn,
            $actor,
            "waitlist",
            "waitlist_removed",
            "student_waitlist",
            $id,
            trim(($entry["name"] ?? "") . " " . ($entry["surname"] ?? "")),
            "Removed waitlist entry for " . ($entry["course_title"] ?? "course"),
            ["course_id" => $entry["course_id"] ?? null]
        );
    }
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
