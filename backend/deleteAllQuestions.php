<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: DELETE');

include "db.php";

try {
    $stmt = $conn->prepare("DELETE FROM questions");
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "All questions deleted successfully."
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete questions: " . $e->getMessage()
    ]);
}
