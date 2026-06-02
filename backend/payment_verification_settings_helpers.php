<?php
function ensure_payment_verification_settings_tables(PDO $conn): void {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS payment_verification_description_options (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            label VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_payment_verification_description_label (label)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
}
