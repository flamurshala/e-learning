<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include "db.php";

$stmt = $conn->prepare("SELECT * FROM courses WHERE completed = 0");
$stmt->execute();
$courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Add professors, students etc as needed...

echo json_encode($courses);
?>
