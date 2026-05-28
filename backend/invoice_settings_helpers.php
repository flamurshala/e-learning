<?php
function ensure_invoice_settings_tables(PDO $conn): void {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS invoice_description_options (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            label VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_invoice_description_label (label)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $defaults = [
        'TRAJNIMI per Cyber Security',
        'TRAJNIMI per Full Stack Development',
        'TRAJNIMI per Web Development',
    ];

    $stmt = $conn->prepare("INSERT IGNORE INTO invoice_description_options (label) VALUES (?)");
    foreach ($defaults as $default) {
        $stmt->execute([$default]);
    }
}
