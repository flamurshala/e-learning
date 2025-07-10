<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$course_id = $data['id'] ?? 0;

if ($course_id) {
    try {
        $conn->beginTransaction();

        $conn->prepare("DELETE FROM student_payments WHERE course_id = ?")->execute([$course_id]);

        $conn->prepare("DELETE FROM course_student WHERE course_id = ?")->execute([$course_id]);

        $stmt = $conn->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$course_id]);

        $conn->commit();

        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        $conn->rollBack();
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Missing course ID"]);
}
?>
    