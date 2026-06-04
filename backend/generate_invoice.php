<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once('vendor/autoload.php');
require_once('db.php');
require_once('invoice_settings_helpers.php');
require_once('audit_helpers.php');

use setasign\Fpdi\Fpdi;

class InvoicePdf extends Fpdi {
    public function currentFontSizePt(): float {
        return $this->FontSizePt;
    }

    public function Yeslygon(array $points, string $style = 'D'): void {
        if (count($points) < 6) return;

        $op = $style === 'F' ? 'f' : ($style === 'FD' || $style === 'DF' ? 'b' : 's');
        $pairs = array_chunk($points, 2);
        $path = [];
        foreach ($pairs as $index => $pair) {
            [$x, $y] = $pair;
            $path[] = sprintf('%.2F %.2F %s', $x * $this->k, ($this->h - $y) * $this->k, $index === 0 ? 'm' : 'l');
        }
        $this->_out(implode(' ', $path) . ' h ' . $op);
    }
}

function to1252(string $s): string {
    if (function_exists('iconv')) {
        $out = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $s);
        if ($out !== false) return $out;
    }
    return utf8_decode($s);
}

function money_value($value): float {
    return round((float)str_replace(',', '.', (string)$value), 2);
}

function money_text(float $value): string {
    return number_format($value, 2, '.', '') . "\xE2\x82\xAC";
}

function draw_right(Fpdi $pdf, float $x, float $y, float $w, string $text): void {
    $originalSize = method_exists($pdf, 'currentFontSizePt') ? $pdf->currentFontSizePt() : null;
    if ($originalSize !== null) {
        $pdf->SetFontSize($originalSize + 1);
    }
    $pdf->SetXY($x, $y);
    $pdf->Cell($w, 14, to1252($text), 0, 0, 'R');
    if ($originalSize !== null) {
        $pdf->SetFontSize($originalSize);
    }
}

function draw_text(Fpdi $pdf, float $x, float $y, string $text, int $size = 10, string $style = '', array $color = [0, 0, 0]): void {
    $size += 1;
    $pdf->SetTextColor($color[0], $color[1], $color[2]);
    $pdf->SetFont('Helvetica', $style, $size);
    $pdf->SetXY($x, $y);
    $pdf->Cell(0, $size + 4, to1252($text), 0, 0, 'L');
}

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$actor = audit_actor_from_payload($data);

$studentId = isset($data['student_id']) ? (int)$data['student_id'] : 0;
$manualStudentName = trim($data['manual_student_name'] ?? '');
$invoiceDate = trim($data['invoice_date'] ?? date('Y-m-d'));
$rawItems = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

if (!$rawItems && isset($data['description'], $data['unit_price'])) {
    $rawItems[] = [
        'course_id' => $data['course_id'] ?? null,
        'description' => $data['description'],
        'unit_price' => $data['unit_price']
    ];
}

$items = [];
foreach ($rawItems as $item) {
    $description = trim($item['description'] ?? '');
    $unitPrice = money_value($item['unit_price'] ?? 0);

    if ($description !== '' && $unitPrice > 0) {
        $items[] = [
            'course_id' => isset($item['course_id']) ? (int)$item['course_id'] : null,
            'description' => $description,
            'unit_price' => $unitPrice,
            'line_total' => $unitPrice
        ];
    }
}

if (($studentId < 1 && $manualStudentName === '') || !$invoiceDate || count($items) < 1) {
    echo json_encode(["success" => false, "error" => "Emri i studentit, data dhe të pakt?n nj? trajnim janë të detyrueshme."]);
    exit;
}

try {
    if ($studentId > 0) {
        $studentStmt = $conn->prepare("
            SELECT id, TRIM(CONCAT(COALESCE(name, ''), ' ', COALESCE(surname, ''))) AS student_name
            FROM students
            WHERE id = ?
            LIMIT 1
        ");
        $studentStmt->execute([$studentId]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            echo json_encode(["success" => false, "error" => "Studenti nuk u gjet."]);
            exit;
        }
    } else {
        $student = [
            'id' => null,
            'student_name' => $manualStudentName
        ];
    }

    $year = (int)date('Y');
    ensure_audit_log_table($conn);
    ensure_invoice_settings_tables($conn);

    $conn->exec("
        CREATE TABLE IF NOT EXISTS invoice_sequence (
            invoice_year INT NOT NULL PRIMARY KEY,
            last_number INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS invoices (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            invoice_number VARCHAR(20) NOT NULL,
            invoice_year INT NOT NULL,
            sequence_number INT NOT NULL,
            student_id INT DEFAULT NULL,
            manual_student_name VARCHAR(255) DEFAULT NULL,
            course_id INT DEFAULT NULL,
            description VARCHAR(255) NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            vat_amount DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            invoice_date DATE NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_invoice_number (invoice_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $invoiceColumns = $conn->query("SHOW COLUMNS FROM invoices")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('manual_student_name', $invoiceColumns, true)) {
        $conn->exec("ALTER TABLE invoices ADD COLUMN manual_student_name VARCHAR(255) DEFAULT NULL AFTER student_id");
    }
    $studentIdColumn = $conn->query("SHOW COLUMNS FROM invoices LIKE 'student_id'")->fetch(PDO::FETCH_ASSOC);
    if ($studentIdColumn && strtoupper((string)$studentIdColumn['Null']) !== 'YES') {
        $conn->exec("ALTER TABLE invoices MODIFY student_id INT DEFAULT NULL");
    }

    ensure_audit_log_table($conn);
    $conn->beginTransaction();

    $seqStmt = $conn->prepare("SELECT last_number FROM invoice_sequence WHERE invoice_year = ? FOR UPDATE");
    $seqStmt->execute([$year]);
    $lastNumber = $seqStmt->fetchColumn();

    if ($lastNumber === false) {
        $lastNumber = 0;
        $insertSeq = $conn->prepare("INSERT INTO invoice_sequence (invoice_year, last_number) VALUES (?, 0)");
        $insertSeq->execute([$year]);
    }

    $sequence = (int)$lastNumber + 1;
    $invoiceNumber = sprintf("%03d/%d", $sequence, $year);

    $updateSeq = $conn->prepare("UPDATE invoice_sequence SET last_number = ? WHERE invoice_year = ?");
    $updateSeq->execute([$sequence, $year]);

    $invoiceDir = __DIR__ . '/invoices/';
    if (!is_dir($invoiceDir)) {
        mkdir($invoiceDir, 0755, true);
    }

    $safeInvoice = str_replace('/', '-', $invoiceNumber);
    $fileName = "invoice_{$safeInvoice}.pdf";
    $filePath = $invoiceDir . $fileName;

    $total = array_reduce($items, fn($sum, $item) => $sum + $item['line_total'], 0);
    $subtotal = round($total / 1.18, 2);
    $vat = round($total - $subtotal, 2);
    $formattedDate = date("d.m.Y", strtotime($invoiceDate));

    $pdf = new InvoicePdf('P', 'pt', [612.48, 792]);
    $pdf->AddPage();

    $blue = [64, 119, 246];
    $black = [0, 0, 0];
    $assetDir = __DIR__ . '/invoice_assets/';

    $pdf->SetFillColor(255, 255, 255);
    $pdf->Rect(0, 0, 612.48, 792, 'F');
    $pdf->SetFillColor($blue[0], $blue[1], $blue[2]);
    $pdf->Yeslygon([0, 0, 112, 0, 0, 86], 'F');
    $pdf->Rect(454, 0, 98, 244, 'F');
    $pdf->SetFillColor(255, 255, 255);
    $pdf->Yeslygon([454, 244, 503, 205, 552, 244], 'F');
    $pdf->SetDrawColor(255, 255, 255);
    $pdf->SetLineWidth(2);
    $pdf->Line(454, 244, 552, 244);

    if (file_exists($assetDir . 'tectigon-logo.png')) {
        $pdf->Image($assetDir . 'tectigon-logo.png', 231, 55, 160);
    } else {
        draw_text($pdf, 248, 58, "TECTIGON", 22, 'B', $blue);
        draw_text($pdf, 309, 84, "ACADEMY", 12, '', $blue);
    }

    draw_text($pdf, 94, 155, "INVOICE TO", 11, '', $black);
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->Line(94, 170, 196, 170);
    draw_text($pdf, 88, 177, $student['student_name'], 12, '', $black);

    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('Helvetica', '', 11);
    $pdf->SetXY(454, 172);
    $pdf->Cell(98, 14, to1252("FATURË"), 0, 0, 'C');

    draw_text($pdf, 88, 248, "Phone: +383 48 66 79 79", 9, '', $black);
    draw_text($pdf, 88, 266, "Email: contact@tectigonacademy.com", 9, '', $black);
    draw_text($pdf, 88, 284, "Website: tectigonacademy.com", 9, '', $black);

    $pdf->SetFont('Helvetica', '', 10);
    draw_right($pdf, 405, 247, 145, "Invoice No: " . $invoiceNumber);
    draw_right($pdf, 405, 265, 145, "Invoice Date:" . $formattedDate);
    draw_right($pdf, 405, 283, 145, "NUI:812182038");
    draw_right($pdf, 405, 301, 145, "NF:812182038");

    $tableX = 98;
    $tableY = 320;
    $tableW = 446;
    $headerH = 24;
    $rowH = 20;
    $rowCount = count($items);
    $visibleRowsHeight = max($rowH, $rowCount * $rowH);
    $bodyH = max(115, $visibleRowsHeight + 115);
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.7);
    $pdf->Rect($tableX, $tableY, $tableW, $headerH + $bodyH);
    $pdf->Line($tableX, $tableY + $headerH, $tableX + $tableW, $tableY + $headerH);
    $lineItemsBottom = $tableY + $headerH + $visibleRowsHeight;
    $pdf->Line($tableX, $lineItemsBottom, $tableX + $tableW, $lineItemsBottom);
    $pdf->Line(136, $tableY, 136, $lineItemsBottom);
    $pdf->Line(178, $tableY, 178, $lineItemsBottom);
    $pdf->Line(382, $tableY, 382, $lineItemsBottom);
    $pdf->Line(464, $tableY, 464, $lineItemsBottom);

    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetXY(98, $tableY + 8);
    $pdf->Cell(38, 8, "ITEM", 0, 0, 'C');
    $pdf->SetXY(136, $tableY + 8);
    $pdf->Cell(42, 8, "QTY.", 0, 0, 'C');
    $pdf->SetXY(178, $tableY + 8);
    $pdf->Cell(204, 8, "DESCRIPTION", 0, 0, 'L');
    $pdf->SetXY(382, $tableY + 8);
    $pdf->Cell(82, 8, "UNIT PRICE", 0, 0, 'C');
    $pdf->SetXY(464, $tableY + 8);
    $pdf->Cell(80, 8, "LINE TOTAL", 0, 0, 'C');

    foreach ($items as $index => $item) {
        $rowY = $tableY + $headerH + ($index * $rowH);
        if ($index > 0) {
            $pdf->Line($tableX, $rowY, $tableX + $tableW, $rowY);
        }

        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetXY(98, $rowY + 7);
        $pdf->Cell(38, 8, (string)($index + 1), 0, 0, 'C');
        $pdf->SetXY(136, $rowY + 7);
        $pdf->Cell(42, 8, "1", 0, 0, 'C');
        $pdf->SetXY(188, $rowY + 7);
        $pdf->Cell(190, 8, to1252($item['description']), 0, 0, 'L');
        $pdf->SetXY(382, $rowY + 7);
        $pdf->Cell(82, 8, to1252(number_format($item['unit_price'], 0, '.', '') . "\xE2\x82\xAC"), 0, 0, 'C');
        $pdf->SetFont('Helvetica', 'B', 8);
        draw_right($pdf, 466, $rowY + 5, 72, money_text($item['line_total']));
    }

    $summaryX = 451;
    $summaryY = $lineItemsBottom + 15;
    $pdf->SetFont('Helvetica', 'B', 8);
    draw_right($pdf, $summaryX, $summaryY, 88, "PA TVSH: " . money_text($subtotal));
    draw_right($pdf, $summaryX, $summaryY + 34, 88, "TVSH:  " . money_text($vat));
    $pdf->Line($summaryX, $summaryY + 49, 540, $summaryY + 49);
    draw_right($pdf, $summaryX, $summaryY + 66, 88, "TOTAL: " . money_text($total));

    $bankY = max(489, $summaryY + 105);
    draw_text($pdf, 101, $bankY, "TECTIGON ACADEMY", 12, '', $black);
    draw_text($pdf, 101, $bankY + 23, "RBKO", 8, 'B', $black);
    draw_text($pdf, 127, $bankY + 23, "IBAN : XK05", 8, '', $black);
    draw_text($pdf, 101, $bankY + 38, "15 01 20 00 00 76 22 45", 8, '', $black);
    $pdf->Line(101, $bankY + 51, 201, $bankY + 51);
    draw_text($pdf, 101, $bankY + 55, "TEB", 8, 'B', $black);
    draw_text($pdf, 126, $bankY + 55, "IBAN : XK05", 8, '', $black);
    draw_text($pdf, 101, $bankY + 70, "20 32 00 02 46 10 23 46", 8, '', $black);
    $pdf->Line(101, $bankY + 83, 201, $bankY + 83);
    draw_text($pdf, 101, $bankY + 87, "OneFor", 8, 'B', $black);
    draw_text($pdf, 139, $bankY + 87, "IBAN: XK05", 8, '', $black);
    draw_text($pdf, 101, $bankY + 102, "50 01 00 01 65 01 12 76", 8, '', $black);
    $pdf->Line(101, $bankY + 115, 201, $bankY + 115);

    draw_text($pdf, 101, max(620, $bankY + 131), "LËSHOI", 11, '', $black);
    if (file_exists($assetDir . 'finance-signature.png')) {
        $pdf->Image($assetDir . 'finance-signature.png', 100, max(632, $bankY + 143), 125);
    }
    $signatureLineY = max(670, $bankY + 181);
    $pdf->Line(101, $signatureLineY, 225, $signatureLineY);
    draw_text($pdf, 101, $signatureLineY + 3, "ZYRA E FINANCAVE", 11, '', $black);

    if (file_exists($assetDir . 'tectigon-stamp.png')) {
        $pdf->Image($assetDir . 'tectigon-stamp.png', 263, max(638, $bankY + 149), 140);
    }

    draw_text($pdf, 505, max(620, $bankY + 131), "PRANOI", 11, '', $black);
    $pdf->Line(433, max(665, $bankY + 176), 557, max(665, $bankY + 176));

    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetXY(0, 728);
    // $pdf->Cell(612.48, 12, "WWW.TECTIGONACADEMY.COM", 0, 0, 'C');

    $pdf->Output('F', $filePath);

    $insertInvoice = $conn->prepare("
        INSERT INTO invoices
        (invoice_number, invoice_year, sequence_number, student_id, manual_student_name, course_id, description, unit_price, vat_amount, subtotal, total, invoice_date, file_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $descriptionSummary = implode('; ', array_map(fn($item) => $item['description'], $items));
    $firstCourseId = $items[0]['course_id'] ?? null;
    $insertInvoice->execute([
        $invoiceNumber,
        $year,
        $sequence,
        $studentId ?: null,
        $studentId ? null : $manualStudentName,
        $firstCourseId ?: null,
        $descriptionSummary,
        $total,
        $vat,
        $subtotal,
        $total,
        $invoiceDate,
        basename($filePath)
    ]);

    record_audit_log(
        $conn,
        $actor,
        "invoices",
        "invoice_generated",
        "invoice",
        null,
        $invoiceNumber,
        "Generated invoice for {$student['student_name']}",
        [
            "invoice_number" => $invoiceNumber,
            "student_id" => $studentId ?: null,
            "manual_student_name" => $studentId ? null : $manualStudentName,
            "course_id" => $firstCourseId ?: null,
            "total" => $total,
        ]
    );

    $conn->commit();

    echo json_encode([
        "success" => true,
        "invoice_number" => $invoiceNumber,
        "invoice_url" => "invoices/" . basename($filePath)
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
