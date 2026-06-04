<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include "db.php";
include "audit_helpers.php";

function valid_report_date($value): bool {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$value)) {
        return false;
    }

    [$year, $month, $day] = array_map('intval', explode('-', $value));
    return checkdate($month, $day, $year);
}

function current_actor_is_superadmin(PDO $conn, array $actor): bool {
    $actorId = isset($actor["id"]) ? (int)$actor["id"] : 0;
    if ($actorId < 1) {
        return false;
    }

    $stmt = $conn->prepare("SELECT username, role FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([$actorId]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        return false;
    }

    return strtolower(trim((string)$admin["username"])) !== "flakos"
        && strtolower(trim((string)$admin["role"])) === "superadmin";
}

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Only POST is allowed"]);
        exit;
    }

    ensure_audit_log_table($conn);

    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $actor = audit_actor_from_payload($data);

    if (!current_actor_is_superadmin($conn, $actor)) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Only superadmin can delete reports"]);
        exit;
    }

    $categories = $data["categories"] ?? [];
    if (!is_array($categories)) {
        $categories = [];
    }

    $allowedCategories = [
        "students",
        "payments",
        "expenses",
        "teacher_salaries",
        "invoices",
        "payment_verifications",
        "waitlist",
        "courses",
        "admins",
        "professors",
        "certificates",
        "announcements",
        "attendance",
    ];

    $categories = array_values(array_unique(array_filter(
        array_map(fn($category) => trim((string)$category), $categories),
        fn($category) => in_array($category, $allowedCategories, true)
    )));

    if (!$categories) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Select at least one report category"]);
        exit;
    }

    $dateFrom = trim((string)($data["date_from"] ?? ""));
    $dateTo = trim((string)($data["date_to"] ?? ""));

    if ($dateTo === "" || !valid_report_date($dateTo)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Select a valid To date"]);
        exit;
    }

    if ($dateFrom !== "" && !valid_report_date($dateFrom)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Select a valid From date"]);
        exit;
    }

    if ($dateFrom !== "" && $dateFrom > $dateTo) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "From date cannot be after To date"]);
        exit;
    }

    $protectedCutoff = date("Y-m-d", strtotime("-1 month"));
    if ($dateTo >= $protectedCutoff) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Reports from the last month cannot be deleted. Choose a To date before {$protectedCutoff}."
        ]);
        exit;
    }

    $where = ["DATE(created_at) <= ?", "DATE(created_at) < ?"];
    $params = [$dateTo, $protectedCutoff];

    if ($dateFrom !== "") {
        $where[] = "DATE(created_at) >= ?";
        $params[] = $dateFrom;
    }

    $categoryPlaceholders = implode(",", array_fill(0, count($categories), "?"));
    $where[] = "category IN ({$categoryPlaceholders})";
    $params = array_merge($params, $categories);

    $sql = "DELETE FROM audit_logs WHERE " . implode(" AND ", $where);
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $deletedCount = $stmt->rowCount();

    record_audit_log(
        $conn,
        $actor,
        "reports",
        "reports_deleted",
        "audit_logs",
        null,
        "Reports cleanup",
        "Deleted {$deletedCount} old report record(s)",
        [
            "date_from" => $dateFrom ?: null,
            "date_to" => $dateTo,
            "protected_cutoff" => $protectedCutoff,
            "categories" => $categories,
            "deleted_count" => $deletedCount
        ]
    );

    echo json_encode([
        "success" => true,
        "deleted_count" => $deletedCount,
        "protected_cutoff" => $protectedCutoff
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
