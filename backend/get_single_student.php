<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

$id = $_GET['id'] ?? 0;

$stmt = $conn->prepare("SELECT * FROM students WHERE id = ?");
$stmt->execute([$id]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($student);
