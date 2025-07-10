<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$professor_id = $data['id'] ?? 0;

if ($professor_id) {
    try {
        $stmt = $conn->prepare("DELETE FROM professors WHERE id = ?");
        $stmt->execute([$professor_id]);

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Missing professor ID"]);
}
?>
