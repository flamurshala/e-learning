<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: *");

include "db.php";

function ensure_admin_role_enum(PDO $conn): void {
    $conn->exec("ALTER TABLE admins MODIFY role ENUM('admin','superadmin','administrata') NOT NULL DEFAULT 'admin'");
}

$data = json_decode(file_get_contents('php://input'), true);

$admin_name = isset($data['username']) ? trim($data['username']) : '';
$admin_email = isset($data['email']) ? trim($data['email']) : '';
$admin_password = isset($data['password']) ? $data['password'] : '';
$admin_role = isset($data['role']) ? trim($data['role']) : '';

$allowed_roles = ['admin', 'superadmin', 'administrata'];
if (!in_array($admin_role, $allowed_roles, true)) {
    echo json_encode(['error' => 'Invalid role']);
    exit;
}

if ($admin_role === 'administrata') {
    if (!preg_match('/^\d{4}$/', $admin_name)) {
        echo json_encode(['error' => 'Administrata code must be exactly 4 digits']);
        exit;
    }
    if (!$admin_email) {
        $admin_email = $admin_name . '@administrata.local';
    }
    $admin_password = $admin_name;
}

if (!$admin_name || !$admin_email || !$admin_password || !$admin_role) {
    echo json_encode(['error' => 'Username, email, password, and role are required']);
    exit;
}

try {
    ensure_admin_role_enum($conn);

    $hashed_password = password_hash($admin_password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$admin_name, $admin_email, $hashed_password, $admin_role]);
    $admin_id = $conn->lastInsertId();

    echo json_encode(['success' => true, 'message' => 'Admin user added successfully', 'admin_id' => $admin_id]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
