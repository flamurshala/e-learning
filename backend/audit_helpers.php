<?php

function ensure_audit_log_table(PDO $conn): void {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            actor_id INT DEFAULT NULL,
            actor_username VARCHAR(255) DEFAULT NULL,
            actor_role VARCHAR(100) DEFAULT NULL,
            category VARCHAR(100) NOT NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100) DEFAULT NULL,
            entity_id INT DEFAULT NULL,
            entity_label VARCHAR(255) DEFAULT NULL,
            description TEXT DEFAULT NULL,
            metadata TEXT DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_audit_actor (actor_id),
            KEY idx_audit_category (category),
            KEY idx_audit_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
}

function audit_actor_from_payload(array $data): array {
    $actor = is_array($data['actor'] ?? null) ? $data['actor'] : [];

    return [
        'id' => isset($actor['id']) ? (int)$actor['id'] : (isset($data['actor_id']) ? (int)$data['actor_id'] : null),
        'username' => trim((string)($actor['username'] ?? $data['actor_username'] ?? 'Unknown')),
        'role' => trim((string)($actor['role'] ?? $data['actor_role'] ?? '')),
    ];
}

function record_audit_log(PDO $conn, array $actor, string $category, string $action, ?string $entityType, $entityId, ?string $entityLabel, ?string $description, array $metadata = []): void {
    if (!$conn->inTransaction()) {
        ensure_audit_log_table($conn);
    }

    $stmt = $conn->prepare("
        INSERT INTO audit_logs
        (actor_id, actor_username, actor_role, category, action, entity_type, entity_id, entity_label, description, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $actor['id'] ?? null,
        $actor['username'] ?? 'Unknown',
        $actor['role'] ?? '',
        $category,
        $action,
        $entityType,
        $entityId ?: null,
        $entityLabel,
        $description,
        $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
    ]);
}
