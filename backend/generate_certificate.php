<?php
require('fpdf/fpdf.php');
include 'db.php';

$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
$course_id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : 0;

if (!$student_id || !$course_id) {
    die("Student ID and Course ID are required.");
}

// Fetch student and course info
$stmt = $conn->prepare("
    SELECT s.name AS student_name, c.title AS course_title
    FROM students s, courses c
    WHERE s.id = ? AND c.id = ?
");
$stmt->execute([$student_id, $course_id]);
$data = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$data) {
    die("Invalid student or course.");
}

// Generate certificate
$pdf = new FPDF('L', 'mm', 'A4');
$pdf->AddPage();
$pdf->SetFont('Arial', 'B', 28);
$pdf->SetTextColor(0, 102, 204);
$pdf->Cell(0, 20, "Certificate of Completion", 0, 1, 'C');

$pdf->SetFont('Arial', '', 18);
$pdf->SetTextColor(0);
$pdf->Ln(10);
$pdf->Cell(0, 10, "This is to certify that", 0, 1, 'C');

$pdf->SetFont('Arial', 'B', 22);
$pdf->Cell(0, 12, $data['student_name'], 0, 1, 'C');

$pdf->SetFont('Arial', '', 18);
$pdf->Ln(5);
$pdf->Cell(0, 10, "has successfully completed the course", 0, 1, 'C');

$pdf->SetFont('Arial', 'B', 20);
$pdf->Cell(0, 12, $data['course_title'], 0, 1, 'C');

$pdf->Ln(15);
$pdf->SetFont('Arial', 'I', 14);
$pdf->Cell(0, 10, "Date: " . date("d/m/Y"), 0, 1, 'C');

$pdf->Output("D", "Certificate_" . $data['student_name'] . ".pdf");
exit;
