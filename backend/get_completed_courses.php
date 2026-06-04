<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

function certificate_file_slug(string $name): string {
    $name = trim($name);

    if (function_exists('iconv')) {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        if ($ascii !== false) {
            $name = $ascii;
        }
    }

    $name = preg_replace('/[^A-Za-z0-9._-]+/', '-', $name);
    $name = trim($name, '-._');

    return $name !== '' ? $name : 'merged-certificates';
}

try {
    $professorId = isset($_GET['professor_id']) ? (int)$_GET['professor_id'] : 0;
    $professorWhere = $professorId > 0 ? "AND (c.professor_id = :professor_id OR cp.professor_id = :professor_id)" : "";

    // Query to get completed courses with professor name and enrolled students
    $stmt = $conn->prepare("
        SELECT 
            c.id,
            c.title,
            c.description,
            c.created_at,
            c.professor_id,
            c.completed,
            COALESCE(
                NULLIF(GROUP_CONCAT(DISTINCT cp_prof.name ORDER BY cp_prof.name SEPARATOR ', '), ''),
                p.name
            ) AS professor_name,
            GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS students
        FROM courses c
        LEFT JOIN professors p ON c.professor_id = p.id
        LEFT JOIN course_professor cp ON cp.course_id = c.id
        LEFT JOIN professors cp_prof ON cp_prof.id = cp.professor_id
        LEFT JOIN course_student sc ON sc.course_id = c.id
        LEFT JOIN students s ON s.id = sc.student_id
        WHERE c.completed = 1
        {$professorWhere}
        GROUP BY c.id
        ORDER BY c.created_at DESC
    ");

    if ($professorId > 0) {
        $stmt->bindValue(':professor_id', $professorId, PDO::PARAM_INT);
    }
    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Transform students from CSV string to array
    foreach ($courses as &$course) {
        if ($course['students']) {
            $course['students'] = explode(', ', $course['students']);
        } else {
            $course['students'] = [];
        }

        $mergedCertificateFile = certificate_file_slug($course['title'] ?? '') . '.pdf';
        $mergedCertificatePath = __DIR__ . '/certificates/' . $mergedCertificateFile;
        $course['merged_certificate_file'] = file_exists($mergedCertificatePath) ? $mergedCertificateFile : null;
    }

    echo json_encode($courses);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
