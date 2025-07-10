<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php'; // Your DB connection file

try {
    $stmt = $conn->query("SELECT * FROM students");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($students);
} catch (PDOException $e) {
    echo json_encode([]);
}
