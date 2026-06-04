<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
include "audit_helpers.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);
$professor_id = $data['id'] ?? 0;

if ($professor_id) {
    try {
        $professorStmt = $conn->prepare("SELECT name, username, email FROM professors WHERE id = ? LIMIT 1");
        $professorStmt->execute([$professor_id]);
        $professor = $professorStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $stmt = $conn->prepare("DELETE FROM professors WHERE id = ?");
        $stmt->execute([$professor_id]);

        record_audit_log(
            $conn,
            $actor,
            "professors",
            "professor_deleted",
            "professor",
            $professor_id,
            $professor['name'] ?? "Professor #{$professor_id}",
            "Deleted professor " . ($professor['name'] ?? "Professor #{$professor_id}"),
            ["username" => $professor['username'] ?? null, "email" => $professor['email'] ?? null]
        );

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Missing professor ID"]);
}
?>
