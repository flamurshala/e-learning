<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Headers: *');

include 'db.php';
include 'audit_helpers.php';

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);
$id = isset($data['id']) ? intval($data['id']) : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid admin ID']);
    exit;
}

try {
    $adminStmt = $conn->prepare("SELECT username, email, role FROM admins WHERE id = ? LIMIT 1");
    $adminStmt->execute([$id]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmt = $conn->prepare("DELETE FROM admins WHERE id = ?");
    $stmt->execute([$id]);

    record_audit_log(
        $conn,
        $actor,
        "admins",
        "admin_deleted",
        "admin",
        $id,
        $admin['username'] ?? "Admin #{$id}",
        "Deleted admin user " . ($admin['username'] ?? "Admin #{$id}"),
        ["email" => $admin['email'] ?? null, "role" => $admin['role'] ?? null]
    );

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error deleting admin: ' . $e->getMessage()]);
}
