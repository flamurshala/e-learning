<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Headers: *');

include 'db.php';

try {
    $stmt = $conn->query("SELECT id, username, email, role FROM admins ORDER BY id DESC");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($admins);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error fetching admins: ' . $e->getMessage()]);
}
