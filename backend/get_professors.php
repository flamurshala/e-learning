<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
include 'db.php'; // Your DB connection file

$sql = "SELECT id, name FROM professors";
$stmt = $conn->query($sql);

$professors = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode($professors);
