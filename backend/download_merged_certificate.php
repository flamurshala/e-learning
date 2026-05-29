<?php
header("Access-Control-Allow-Origin: *");

require_once "db.php";

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

$courseId = $_GET['course_id'] ?? null;

if (!$courseId) {
    http_response_code(400);
    echo "Missing course ID.";
    exit;
}

$stmt = $conn->prepare("SELECT title FROM courses WHERE id = ?");
$stmt->execute([$courseId]);
$courseTitle = $stmt->fetchColumn();

if (!$courseTitle) {
    http_response_code(404);
    echo "Course not found.";
    exit;
}

$fileName = certificate_file_slug($courseTitle) . '.pdf';
$filePath = __DIR__ . '/certificates/' . $fileName;

if (!is_file($filePath)) {
    http_response_code(404);
    echo "Merged certificates file not found.";
    exit;
}

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: private, max-age=0, must-revalidate');

readfile($filePath);
exit;
