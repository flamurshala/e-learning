<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Headers: *');

include 'db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id < 1) {
    echo json_encode(['success' => false, 'error' => 'ID e administratorit është e pavlefshme']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, username, email, role FROM admins WHERE id = ?");
    $stmt->execute([$id]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        echo json_encode(['success' => false, 'error' => 'Administratori nuk u gjet']);
        exit;
    }

    echo json_encode($admin);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Gabim gjatë marrjes së administratorit: ' . $e->getMessage()]);
}
