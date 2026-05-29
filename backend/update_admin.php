<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Headers: *');

include 'db.php';
include 'audit_helpers.php';

function ensure_admin_role_enum(PDO $conn): void {
    $conn->exec("ALTER TABLE admins MODIFY role ENUM('admin','superadmin','administrata') NOT NULL DEFAULT 'admin'");
}

$data = json_decode(file_get_contents('php://input'), true);
$actor = audit_actor_from_payload($data ?: []);

$id = isset($data['id']) ? (int)$data['id'] : 0;
$username = isset($data['username']) ? trim($data['username']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';
$role = isset($data['role']) ? trim($data['role']) : '';

$allowed_roles = ['admin', 'superadmin', 'administrata'];
if ($id < 1) {
    echo json_encode(['success' => false, 'error' => 'ID e administratorit është e pavlefshme']);
    exit;
}

if (!in_array($role, $allowed_roles, true)) {
    echo json_encode(['success' => false, 'error' => 'Rol i pavlefsh?m']);
    exit;
}

if ($role === 'administrata') {
    if (!preg_match('/^\d{4}$/', $username)) {
        echo json_encode(['success' => false, 'error' => 'Kodi i aksesit për administrat?n duhet të ketë sakt?sisht 4 shifra']);
        exit;
    }
    if (!$email) {
        $email = $username . '@administrata.local';
    }
    $password = $password !== '' ? $password : $username;
} elseif (!$username || !$email) {
    echo json_encode(['success' => false, 'error' => 'Emri i përdoruesit, emaili dhe roli janë të detyrueshme']);
    exit;
}

if (!$username || !$email || !$role) {
    echo json_encode(['success' => false, 'error' => 'Emri i përdoruesit, emaili dhe roli janë të detyrueshme']);
    exit;
}

try {
    ensure_admin_role_enum($conn);

    if ($password !== '') {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE admins SET username = ?, email = ?, password = ?, role = ? WHERE id = ?");
        $stmt->execute([$username, $email, $hashed_password, $role, $id]);
    } else {
        $stmt = $conn->prepare("UPDATE admins SET username = ?, email = ?, role = ? WHERE id = ?");
        $stmt->execute([$username, $email, $role, $id]);
    }
    record_audit_log(
        $conn,
        $actor,
        "admins",
        "admin_updated",
        "admin",
        $id,
        $username,
        "U përdit?sua përdoruesi administrator {$username}",
        ["role" => $role]
    );

    echo json_encode(['success' => true, 'message' => 'Administratori u përdit?sua me sukses']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Gabim gjatë përdit?simit të administratorit: ' . $e->getMessage()]);
}
