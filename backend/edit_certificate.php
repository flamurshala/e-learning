<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once("db.php");
require_once("audit_helpers.php");
require_once("vendor/autoload.php");
use setasign\Fpdi\Fpdi;

mb_internal_encoding('UTF-8');

function to1252(string $text): string {
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $text);
        if ($converted !== false) {
            return $converted;
        }
    }

    return utf8_decode($text);
}

function uppercaseUtf8(string $text): string {
    return function_exists('mb_strtoupper')
        ? mb_strtoupper($text, 'UTF-8')
        : strtoupper($text);
}

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);
$certificateId = $data['certificate_id'] ?? null;

if (!$certificateId) {
    echo json_encode(['error' => 'Missing certificate ID']);
    exit;
}

// Fetch current certificate info
$stmt = $conn->prepare("SELECT file_path FROM certificates WHERE certificate_id = ?");
$stmt->execute([$certificateId]);
$currentFile = $stmt->fetchColumn();

if (!$currentFile) {
    echo json_encode(['error' => 'Certificate not found']);
    exit;
}

$manualName = uppercaseUtf8($data['manual_name'] ?? 'STUDENT');
$courseText = uppercaseUtf8($data['course_text'] ?? 'COURSE');
$duration = $data['duration'] ?? '60h';
$date = $data['date'] ?? date('Y-m-d');
$instructor = $data['instructor'] ?? 'Instructor';
$formattedDate = date("F d, Y", strtotime($date));

$manualNamePdf = to1252($manualName);
$courseTextPdf = to1252($courseText);
$durationPdf = to1252($duration);
$formattedDatePdf = to1252($formattedDate);
$instructorPdf = to1252($instructor);

// === Re-generate PDF ===
$certDir = __DIR__ . '/certificates/';
if (!is_dir($certDir)) {
    mkdir($certDir, 0755, true);
}
$filePath = $certDir . $currentFile;

$pdf = new Fpdi('L', 'mm', 'A4');
$pdf->AddPage();
$pdf->setSourceFile('Template.pdf');
$templateId = $pdf->importPage(1);
$pdf->useTemplate($templateId, 0, 0, 297);

$pdf->AddFont('Birthday', '', 'Birthday.php');
$pdf->AddFont('BaiJamjureeMedium', '', 'BaiJamjuree-Medium.php');
$pdf->AddFont('BaiJamjureeLight', '', 'BaiJamjuree-Light.php');

// Name
$pdf->SetTextColor(26, 26, 26);
$pdf->SetFont('BaiJamjureeMedium', '', 40.17);
$pdf->SetXY(38.28, 82.68);
$pdf->Cell(100, 10, $manualNamePdf, 0, 0, 'L');

// Line under name
$pdf->SetLineWidth(0.176);
$pdf->SetDrawColor(77, 77, 77);
$nameWidth = $pdf->GetStringWidth($manualNamePdf);
$pdf->Line(38.28 - 2.5, 93.68, 38.28 - 2.5 + $nameWidth + 4.5, 93.68);

// Course text
$pdf->SetTextColor(51, 51, 51);
$pdf->SetFont('BaiJamjureeLight', '', 40);
$pdf->SetXY(21.50, 131.79);
$pdf->MultiCell(150, 14, $courseTextPdf, 0, 'L');

// Duration
$pdf->SetTextColor(77, 77, 77);
$pdf->SetFont('BaiJamjureeLight', '', 19.3);
$pdf->SetXY(22.99, 159);
$pdf->Cell(20, 10, $durationPdf, 0, 1, 'L');

// Certificate ID
$pdf->SetTextColor(128, 128, 128);
$pdf->SetFont('BaiJamjureeLight', '', 24.15);
$pdf->Text(23.5, 182.2, "No: $certificateId");

// Date
$pdf->SetTextColor(51, 51, 51);
$pdf->SetFont('BaiJamjureeLight', '', 25);
$pdf->Text(23.5, 190, $formattedDatePdf);

// Instructor
$pdf->SetTextColor(0, 0, 71);
$pdf->SetFont('Birthday', '', 32.37);
$pdf->Text(148.12, 189, $instructorPdf);

$pdf->Output('F', $filePath);

// === Update DB ===
$stmt = $conn->prepare("
    UPDATE certificates SET 
        manual_name = ?, 
        course_text = ?, 
        duration = ?, 
        selected_date = ?, 
        instructor = ? 
    WHERE certificate_id = ?
");
$stmt->execute([
    $manualName,
    $courseText,
    $duration,
    $date,
    $instructor,
    $certificateId
]);

if ($stmt->rowCount() === 0) {
    error_log("DB update failed for certificate ID: $certificateId");
}

record_audit_log(
    $conn,
    $actor,
    "certificates",
    "certificate_updated",
    "certificate",
    $certificateId,
    "Certificate #{$certificateId}",
    "Updated certificate #{$certificateId}",
    [
        "manual_name" => $manualName,
        "course_text" => $courseText,
        "duration" => $duration,
        "selected_date" => $date,
        "instructor" => $instructor
    ]
);


// At the end of the PHP file
echo json_encode([
    'success' => true,
    'file_url' => 'certificates/' . basename($currentFile)

]);
exit;
