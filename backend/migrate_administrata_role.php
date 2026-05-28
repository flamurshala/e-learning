<?php
include "db.php";

try {
    $conn->exec("ALTER TABLE admins MODIFY role ENUM('admin','superadmin','administrata') NOT NULL DEFAULT 'admin'");
    echo json_encode(["success" => true, "message" => "Roli administrata u shtua"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
