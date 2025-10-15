<?php
// === CORS HEADERS ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// === ERROR LOGGING ===
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// === DEPENDENCIES ===
require_once('vendor/autoload.php');
require_once('db.php');
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfReader;

// ---------- Encoding helpers (no other files changed) ----------
mb_internal_encoding('UTF-8');

/**
 * Convert UTF-8 text to Windows-1252 for FPDF.
 * ë/Ë/ç/Ç exist in cp1252 so they render correctly with standard FPDF fonts.
 */
function to1252(string $s): string {
    if (function_exists('iconv')) {
        $out = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $s);
        if ($out !== false) return $out;
    }
    // Fallback handles many Western chars (ë, ç included)
    return utf8_decode($s);
}

/** Uppercase in UTF-8 first (so ë -> Ë, ç -> Ç), then convert to cp1252 */
function up_utf8_to1252(string $s): string {
    $upper = function_exists('mb_strtoupper') ? mb_strtoupper($s, 'UTF-8') : strtoupper($s);
    return to1252($upper);
}
// ---------------------------------------------------------------

// === PARSE INPUT ===
$data = json_decode(file_get_contents("php://input"), true);

$course_id         = $data['course_id']       ?? null;
$manual_name       = $data['manual_name']     ?? null;
$course_text       = $data['course_text']     ?? null;
$duration          = $data['duration']        ?? '60h';
$date              = $data['date']            ?? date('Y-m-d');
$instructor        = $data['instructor']      ?? 'Instructor';
$selected_students = $data['selected_students'] ?? [];

if (empty($selected_students) && !$manual_name) {
    die(json_encode(['error' => 'No students selected or manual name missing']));
}

if (!$course_id && !$manual_name) {
    die(json_encode(['error' => 'Missing course_id. Please select a course or manually enter student name.']));
}

// === Get course from DB ===
$course_title = null;

if ($course_id) {
    $stmt = $conn->prepare("SELECT title FROM courses WHERE id = ?");
    $stmt->execute([$course_id]);
    $course_title = $stmt->fetchColumn();
    if (!$course_title && !$course_text) {
        die(json_encode(['error' => 'Course not found, and no custom course text provided']));
    }
}

// Use custom course text if provided (uppercase in UTF-8, then convert for FPDF)
$course_upper_1252 = up_utf8_to1252($course_text ?: ($course_title ?? ''));

// === Get selected students (include surname) ===
$students = [];
if (!empty($selected_students)) {
    $placeholders = implode(',', array_fill(0, count($selected_students), '?'));
    $stmt = $conn->prepare("
        SELECT 
            id,
            TRIM(CONCAT(COALESCE(name,''), ' ', COALESCE(surname,''))) AS name
        FROM students
        WHERE id IN ($placeholders)
    ");
    $stmt->execute($selected_students);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// === Add manual student if provided ===
if ($manual_name) {
    $students[] = [
        'id'   => null,
        'name' => $manual_name   // keep UTF-8 in DB; convert only for PDF
    ];
}

if (empty($students)) {
    die(json_encode(['error' => 'No students to generate certificate for']));
}

// === Create output directory ===
$certDir = __DIR__ . '/certificates/';
if (!is_dir($certDir)) {
    mkdir($certDir, 0755, true);
}

$pdfFiles = [];

foreach ($students as $student) {
    // Name: uppercase in UTF-8 (Ë/Ç correct) then convert to cp1252 for FPDF
    $name_1252 = up_utf8_to1252(trim($student['name']));

    // === Get next certificate ID (kept as-is) ===
    $conn->beginTransaction();

    $seqStmt = $conn->prepare("SELECT last_certificate_id FROM certificate_sequence WHERE id = 1 FOR UPDATE");
    $seqStmt->execute();
    $lastId = (int) $seqStmt->fetchColumn();

    $nextId = $lastId + 1;

    $updateStmt = $conn->prepare("UPDATE certificate_sequence SET last_certificate_id = ? WHERE id = 1");
    $updateStmt->execute([$nextId]);

    $conn->commit();

    $certificateId = $nextId;

    // Convert other possibly accented fields for FPDF output
    $formattedDate      = date("F d, Y", strtotime($date));
    $formattedDate_1252 = to1252($formattedDate);
    $duration_1252      = to1252($duration);
    $instructor_1252    = to1252($instructor);

    $fileName = "certificate_{$certificateId}.pdf";
    $filePath = $certDir . $fileName;

    $pdf = new Fpdi('L', 'mm', 'A4');
    $pdf->AddPage();
    $pdf->setSourceFile('Template.pdf');
    $templateId = $pdf->importPage(1);
    $pdf->useTemplate($templateId, 0, 0, 297);

    // NOTE: these are FPDF font PHP files encoded for cp1252
    $pdf->AddFont('Birthday', '', 'Birthday.php');
    $pdf->AddFont('BaiJamjureeMedium', '', 'BaiJamjuree-Medium.php');
    $pdf->AddFont('BaiJamjureeLight', '', 'BaiJamjuree-Light.php');

    // Student Name
    $pdf->SetTextColor(26, 26, 26);
    $pdf->SetFont('BaiJamjureeMedium', '', 40.17);
    $pdf->SetXY(38.28, 82.68);
    $pdf->Cell(100, 10, $name_1252, 0, 0, 'L');

    // Line under name
    $pdf->SetLineWidth(0.176);
    $pdf->SetDrawColor(77, 77, 77);
    $nameWidth = $pdf->GetStringWidth($name_1252);
    $startX = 38.28 - 2.5;
    $pdf->Line($startX, 93.68, $startX + $nameWidth + 4.5, 93.68);

    // Course name (multi-line)
    $pdf->SetTextColor(51, 51, 51);
    $pdf->SetFont('BaiJamjureeLight', '', 40);
    $pdf->SetXY(21.50, 131.79);
    $pdf->MultiCell(150, 14, $course_upper_1252, 0, 'L');

    // Duration
    $pdf->SetTextColor(77, 77, 77);
    $pdf->SetFont('BaiJamjureeLight', '', 19.3);
    $pdf->SetXY(22.99, 159);
    $pdf->Cell(20, 10, $duration_1252, 0, 1, 'L');

    // Certificate ID
    $pdf->SetTextColor(128, 128, 128);
    $pdf->SetFont('BaiJamjureeLight', '', 24.15);
    $pdf->Text(23.5, 182.2, "No: $certificateId");

    // Date
    $pdf->SetTextColor(51, 51, 51);
    $pdf->SetFont('BaiJamjureeLight', '', 25);
    $pdf->Text(23.5, 190, $formattedDate_1252);

    // Instructor name
    $pdf->SetTextColor(0, 0, 71);
    $pdf->SetFont('Birthday', '', 32.37);
    $pdf->Text(148.12, 189, $instructor_1252);

    $pdf->Output('F', $filePath);
    $pdfFiles[] = $filePath;

    // Save record (keep UTF-8 in DB)
    if ($student['id']) {
        $stmt = $conn->prepare("
            INSERT INTO certificates 
            (student_id, manual_name, course_id, course_text, certificate_id, file_path, selected_date, duration, instructor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $student['id'],                              // student_id or null
            $student['id'] ? null : $student['name'],   // manual_name if no student_id
            $course_id,
            $course_text ?: $course_title,
            $certificateId,
            basename($filePath),
            $date,
            $duration,
            $instructor
        ]);
    }
}

// === Merge all PDFs into one ===
$mergedBaseName   = 'merged_' . time() . '.pdf';
$mergedFilePath   = $certDir . $mergedBaseName;
$mergedPublicPath = 'certificates/' . $mergedBaseName;

$mergedPdf = new Fpdi();

foreach ($pdfFiles as $file) {
    $pageCount = $mergedPdf->setSourceFile($file);
    for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
        $tpl  = $mergedPdf->importPage($pageNo);
        $size = $mergedPdf->getTemplateSize($tpl);

        $mergedPdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $mergedPdf->useTemplate($tpl);
    }
}

$mergedPdf->Output('F', $mergedFilePath);

// === Return URL to merged PDF ===
echo json_encode([
    'success'        => true,
    'merged_pdf_url' => $mergedPublicPath
]);

exit();
