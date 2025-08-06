<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
include 'db.php';

$stmt = $conn->query("SELECT id, title FROM courses");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
