<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

try {
    $stmt = $conn->prepare("
        SELECT 
            p.id        AS professor_id,
            p.name      AS professor_name,
            p.username  AS username,     -- ✅ include username
            p.email,
            p.password,
            c.title     AS course_title
        FROM professors p
        LEFT JOIN courses c 
            ON c.professor_id = p.id 
            AND (c.completed = 0 OR c.completed IS NULL)
        ORDER BY p.name ASC, c.title ASC
    ");
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $professors = [];

    foreach ($rows as $row) {
        $id = $row['professor_id'];
        if (!isset($professors[$id])) {
            $professors[$id] = [
                'id'       => $id,
                'name'     => $row['professor_name'],
                'username' => $row['username'],  // ✅ added to output
                'email'    => $row['email'],
                'password' => $row['password'],
                'courses'  => [],
            ];
        }

        if (!empty($row['course_title'])) {
            $professors[$id]['courses'][] = $row['course_title'];
        }
    }

    echo json_encode(array_values($professors));
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
