<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    $stmt = $conn->prepare("
        SELECT 
            p.id AS professor_id,
            p.name AS professor_name,
            p.email,
            p.password,
            c.title AS course_title
        FROM professors p
        LEFT JOIN courses c 
            ON c.professor_id = p.id 
            AND (c.completed = 0 OR c.completed IS NULL)
    ");
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $professors = [];

    foreach ($rows as $row) {
        $id = $row['professor_id'];
        if (!isset($professors[$id])) {
            $professors[$id] = [
                'id' => $id,
                'name' => $row['professor_name'],
                'email' => $row['email'],
                'password' => $row['password'],
                'courses' => [],
            ];
        }

        if ($row['course_title']) {
            $professors[$id]['courses'][] = $row['course_title'];
        }
    }

    echo json_encode(array_values($professors));
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
