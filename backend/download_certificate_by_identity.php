<?php

require_once __DIR__ . '/config.php';

function send_json(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function apply_certificate_download_cors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = backend_config('certificate_download_allowed_origins') ?: [];

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');
}

function get_request_api_key(): string {
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        return trim((string)$_SERVER['HTTP_X_API_KEY']);
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $name => $value) {
            if (strcasecmp($name, 'X-API-KEY') === 0) {
                return trim((string)$value);
            }
        }
    }

    return '';
}

function normalize_full_name(string $name): string {
    $name = preg_replace('/\s+/u', ' ', trim($name)) ?? '';
    return function_exists('mb_strtolower') ? mb_strtolower($name, 'UTF-8') : strtolower($name);
}

function find_student_full_name_by_certificate_student_ref(PDO $conn, string $studentRef): string {
    $studentRef = trim($studentRef);
    if ($studentRef === '') {
        return '';
    }

    $stmt = $conn->prepare("
        SELECT TRIM(CONCAT(COALESCE(name, ''), ' ', COALESCE(surname, ''))) AS full_name
        FROM students
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$studentRef]);

    $fullName = trim((string)($stmt->fetchColumn() ?: ''));
    if ($fullName !== '') {
        return $fullName;
    }

    if (!ctype_digit($studentRef)) {
        return '';
    }

    $stmt = $conn->prepare("
        SELECT TRIM(CONCAT(COALESCE(name, ''), ' ', COALESCE(surname, ''))) AS full_name
        FROM students
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([(int)$studentRef]);

    return trim((string)($stmt->fetchColumn() ?: ''));
}

function rate_limit_certificate_download(): void {
    $maxAttempts = max(1, (int)backend_config('certificate_download_rate_limit_max'));
    $windowSeconds = max(1, (int)backend_config('certificate_download_rate_limit_window'));
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'e_learning_certificate_download_rate_limit';

    if (!is_dir($rateDir) && !mkdir($rateDir, 0700, true) && !is_dir($rateDir)) {
        return;
    }

    $rateFile = $rateDir . DIRECTORY_SEPARATOR . hash('sha256', $clientIp) . '.json';
    $now = time();
    $attempts = [];

    $handle = fopen($rateFile, 'c+');
    if ($handle === false) {
        return;
    }

    flock($handle, LOCK_EX);
    $contents = stream_get_contents($handle);
    if ($contents !== false && $contents !== '') {
        $decoded = json_decode($contents, true);
        if (is_array($decoded)) {
            foreach ($decoded as $timestamp) {
                if (is_int($timestamp) && ($now - $timestamp) < $windowSeconds) {
                    $attempts[] = $timestamp;
                }
            }
        }
    }

    if (count($attempts) >= $maxAttempts) {
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($attempts));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
        send_json(429, ['error' => 'Too many requests']);
    }

    $attempts[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($attempts));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

function resolve_certificate_pdf_path(?string $storedPath): ?string {
    if ($storedPath === null || trim($storedPath) === '') {
        return null;
    }

    $allowedDir = realpath(__DIR__ . '/certificates');
    if ($allowedDir === false) {
        return null;
    }

    $relativePath = str_replace('\\', '/', trim($storedPath));
    $relativePath = ltrim($relativePath, '/');

    if (preg_match('/^[A-Za-z]:\//', $relativePath) || strpos($relativePath, "\0") !== false) {
        return null;
    }

    $pathParts = explode('/', $relativePath);
    if (in_array('..', $pathParts, true)) {
        return null;
    }

    if (strpos($relativePath, 'certificates/') === 0) {
        $relativePath = substr($relativePath, strlen('certificates/'));
    }

    $realPath = realpath($allowedDir . DIRECTORY_SEPARATOR . $relativePath);
    if ($realPath === false || !is_file($realPath)) {
        return null;
    }

    $allowedPrefix = rtrim($allowedDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (strpos($realPath, $allowedPrefix) !== 0) {
        return null;
    }

    if (strtolower(pathinfo($realPath, PATHINFO_EXTENSION)) !== 'pdf') {
        return null;
    }

    return $realPath;
}

apply_certificate_download_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');
    send_json(405, ['error' => 'Method not allowed']);
}

rate_limit_certificate_download();

$validApiKey = (string)backend_config('certificate_download_api_key');
if ($validApiKey === '') {
    send_json(500, ['error' => 'Server configuration error']);
}

$requestApiKey = get_request_api_key();
if ($requestApiKey === '' || !hash_equals($validApiKey, $requestApiKey)) {
    send_json(401, ['error' => 'Unauthorized']);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    send_json(400, ['error' => 'Invalid JSON body']);
}

$fullName = trim((string)($data['fullName'] ?? ''));
$certificateId = trim((string)($data['certificateId'] ?? ''));

if ($fullName === '' || $certificateId === '') {
    send_json(400, ['error' => 'fullName and certificateId are required']);
}

require_once __DIR__ . '/db.php';

try {
    $stmt = $conn->prepare("
        SELECT
            c.student_id,
            c.manual_name,
            c.file_path,
            c.certificate_id
        FROM certificates c
        WHERE BINARY c.certificate_id = ?
        LIMIT 1
    ");
    $stmt->execute([$certificateId]);
    $certificate = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$certificate) {
        send_json(404, ['error' => 'Certificate not found']);
    }

    $storedName = trim((string)($certificate['manual_name'] ?? ''));
    if ($storedName === '') {
        $storedName = find_student_full_name_by_certificate_student_ref($conn, (string)($certificate['student_id'] ?? ''));
    }

    if ($storedName === '' || normalize_full_name($fullName) !== normalize_full_name($storedName)) {
        send_json(404, ['error' => 'Certificate not found']);
    }

    $pdfPath = resolve_certificate_pdf_path($certificate['file_path'] ?? null);
    if ($pdfPath === null || !is_readable($pdfPath)) {
        send_json(404, ['error' => 'Certificate not found']);
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="certificate.pdf"');
    header('Cache-Control: private, max-age=0, must-revalidate');
    $fileSize = filesize($pdfPath);
    if ($fileSize !== false) {
        header('Content-Length: ' . $fileSize);
    }

    readfile($pdfPath);
    exit;
} catch (PDOException $e) {
    send_json(404, ['error' => 'Certificate not found']);
}
