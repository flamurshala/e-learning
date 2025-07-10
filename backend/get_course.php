<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $stmt = $conn->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        $course = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($course);
    } else {
        $stmt = $conn->query("SELECT id, title FROM courses");
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($courses);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
    