<?php
require_once('vendor/autoload.php');

use setasign\Fpdi\Fpdi;

// === GET data ===
$name = strtoupper($_GET['name'] ?? 'UNKNOWN');
$courseRaw = $_GET['course'] ?? 'COURSE';
$course = strtoupper(str_replace("\\n", "\n", $courseRaw)); // uppercased + line breaks
$duration = $_GET['duration'] ?? '00h';
$date = $_GET['date'] ?? date('Y-m-d');
$instructor = $_GET['instructor'] ?? 'Instructor';
$certificateId = rand(24000000, 24999999);
$formattedDate = date("F d, Y", strtotime($date));

// === Create PDF with FPDI ===
$pdf = new Fpdi('L', 'mm', 'A4');
$pdf->AddPage();

// Use template
$pdf->setSourceFile('Template.pdf');
$templateId = $pdf->importPage(1);
$pdf->useTemplate($templateId, 0, 0, 297);

// === Add Fonts ===
$pdf->AddFont('Birthday', '', 'Birthday.php');
$pdf->AddFont('BaiJamjureeMedium', '', 'BaiJamjuree-Medium.php');
$pdf->AddFont('BaiJamjureeLight', '', 'BaiJamjuree-Light.php');

// === STUDENT NAME (Medium) ===
$pdf->SetTextColor(26, 26, 26);
$pdf->SetFont('BaiJamjureeMedium', '', 40.17);
$pdf->SetXY(38.28, 82.68);
$pdf->Cell(100, 10, $name, 0, 0, 'L');

// === LINE UNDER STUDENT NAME ===
$pdf->SetLineWidth(0.176); // 0.5pt ≈ 0.176mm
$pdf->SetDrawColor(77, 77, 77); // Dark gray line

$nameWidth = $pdf->GetStringWidth($name);
$preOffset = 2.5; // start 2.5mm before
$postOffset = 2.0; // end 2mm after

$startX = 38.28 - $preOffset;
$lineY = 93.68; // adjust Y to align under text baseline (try between 90–92)

$pdf->Line($startX, $lineY, $startX + $nameWidth + $preOffset + $postOffset, $lineY);


// ✅ === COURSE NAME (Light, Multi-line) ===
$pdf->SetTextColor(51, 51, 51);
$pdf->SetFont('BaiJamjureeLight', '', 40);
$pdf->SetXY(21.50, 131.79);
$pdf->MultiCell(150, 14, $course, 0, 'L'); // height=14mm for good spacing

// === DURATION (Light) ===
$pdf->SetTextColor(77, 77, 77);
$pdf->SetFont('BaiJamjureeLight', '', 19.3);
$pdf->SetXY(22.99, 159);
$pdf->Cell(20, 10, $duration, 0, 1, 'L');

// === CERTIFICATE ID (Light) ===
$pdf->SetTextColor(128, 128, 128);
$pdf->SetFont('BaiJamjureeLight', '', 24.15);
$pdf->Text(23.5, 182.2, "No: $certificateId");

// === DATE (Light) ===
$pdf->SetTextColor(51, 51, 51);
$pdf->SetFont('BaiJamjureeLight', '', 25);
$adjustedY = 181.74 + (25 * 0.35);
$pdf->Text(23.5, $adjustedY, $formattedDate);

// === INSTRUCTOR NAME (Birthday font) ===
$pdf->SetTextColor(0, 0, 71);
$pdf->SetFont('Birthday', '', 32.37);
$pdf->Text(148.12, 189, $instructor);

// === OUTPUT PDF ===
$pdf->Output('I', 'certificate.pdf');
