<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

include "db.php";
if (!defined("FPDF_FONTPATH")) {
    define("FPDF_FONTPATH", __DIR__ . "/fpdf/font/");
}
require_once __DIR__ . "/fpdf.php";

function pdf_text($value): string {
    $text = trim((string)$value);
    if ($text === "") {
        return "";
    }

    if (function_exists("iconv")) {
        $converted = @iconv("UTF-8", "windows-1252//TRANSLIT", $text);
        if ($converted !== false) {
            return $converted;
        }
    }

    return $text;
}

function file_slug(string $name): string {
    $name = trim($name);

    if (function_exists("iconv")) {
        $ascii = @iconv("UTF-8", "ASCII//TRANSLIT", $name);
        if ($ascii !== false) {
            $name = $ascii;
        }
    }

    $name = preg_replace("/[^A-Za-z0-9._-]+/", "-", $name);
    $name = trim($name, "-._");

    return $name !== "" ? $name : "attendance";
}

function format_date_only(?string $value): string {
    if (!$value) {
        return "";
    }

    try {
        return (new DateTime($value, new DateTimeZone("UTC")))->format("Y-m-d");
    } catch (Throwable $e) {
        return substr($value, 0, 10);
    }
}

function session_display_name(array $row): string {
    $title = trim((string)($row["session_title"] ?? ""));
    if ($title !== "") {
        return $title;
    }

    $sessionNumber = (int)($row["session_number"] ?? 0);
    $maxSessionNumber = (int)($row["max_session_number"] ?? 0);

    if ($sessionNumber === 1) {
        return "Sessioni Informues";
    }

    if ($maxSessionNumber >= 3 && $sessionNumber >= $maxSessionNumber - 1) {
        return "Extra Hours";
    }

    return $sessionNumber > 1 ? "Session " . ($sessionNumber - 1) : "Session";
}

$courseId = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;
$studentId = isset($_GET["student_id"]) && $_GET["student_id"] !== "all" ? (int)$_GET["student_id"] : 0;

if ($courseId < 1) {
    http_response_code(400);
    echo "Course ID is required.";
    exit;
}

try {
    try { $conn->exec("SET time_zone = '+00:00'"); } catch (Throwable $e) {}

    $courseStmt = $conn->prepare("SELECT id, title FROM courses WHERE id = ? LIMIT 1");
    $courseStmt->execute([$courseId]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        http_response_code(404);
        echo "Course not found.";
        exit;
    }

    $student = null;
    if ($studentId > 0) {
        $studentStmt = $conn->prepare("
            SELECT
                s.id,
                TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name
            FROM course_student cs
            INNER JOIN students s ON s.id = cs.student_id
            WHERE cs.course_id = ? AND s.id = ?
            LIMIT 1
        ");
        $studentStmt->execute([$courseId, $studentId]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            http_response_code(404);
            echo "Student not found for this course.";
            exit;
        }
    }

    $studentFilter = $studentId > 0 ? "AND s.id = ?" : "";
    $params = $studentId > 0 ? [$courseId, $studentId] : [$courseId];

    $attendanceStmt = $conn->prepare("
        SELECT
            s.id AS student_id,
            TRIM(CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, ''))) AS student_name,
            COALESCE(a.status, '') AS status,
            DATE_FORMAT(ts.session_date, '%Y-%m-%d %H:%i:%s') AS session_date,
            COALESCE(p.name, '') AS professor_name,
            ts.session_number,
            ts.session_title,
            mx.max_session_number
        FROM course_student cs
        INNER JOIN students s ON s.id = cs.student_id
        INNER JOIN training_sessions ts ON ts.course_id = cs.course_id
        INNER JOIN (
            SELECT course_id, MAX(session_number) AS max_session_number
            FROM training_sessions
            WHERE course_id = ?
            GROUP BY course_id
        ) mx ON mx.course_id = ts.course_id
        LEFT JOIN attendance a ON a.session_id = ts.id AND a.student_id = s.id
        LEFT JOIN professors p ON p.id = ts.submitted_by_professor_id
        WHERE cs.course_id = ?
          AND ts.submitted_at IS NOT NULL
          {$studentFilter}
        ORDER BY s.name ASC, s.surname ASC, ts.session_number ASC
    ");
    array_unshift($params, $courseId);
    $attendanceStmt->execute($params);
    $rows = $attendanceStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalSubmittedRecords = count($rows);
    $attendedRecords = 0;
    $studentPercentages = [];
    foreach ($rows as $row) {
        $studentKey = (int)$row["student_id"];
        if (!isset($studentPercentages[$studentKey])) {
            $studentPercentages[$studentKey] = [
                "student_name" => $row["student_name"] ?: ("Student #" . $studentKey),
                "total" => 0,
                "attended" => 0,
            ];
        }

        $studentPercentages[$studentKey]["total"]++;

        if (in_array($row["status"], ["present", "online"], true)) {
            $attendedRecords++;
            $studentPercentages[$studentKey]["attended"]++;
        }
    }
    $attendancePercentage = $totalSubmittedRecords > 0
        ? round(($attendedRecords / $totalSubmittedRecords) * 100, 2)
        : 0;

    foreach ($studentPercentages as &$studentPercentage) {
        $studentPercentage["percentage"] = $studentPercentage["total"] > 0
            ? round(($studentPercentage["attended"] / $studentPercentage["total"]) * 100, 2)
            : 0;
    }
    unset($studentPercentage);

    $courseTitle = trim((string)$course["title"]);
    $selectedStudentName = $student ? trim((string)$student["student_name"]) : "";
    $fileName = $selectedStudentName !== ""
        ? file_slug($courseTitle . " " . $selectedStudentName) . ".pdf"
        : file_slug($courseTitle . " attendance") . ".pdf";

    $pdf = new FPDF("L", "mm", "A4");
    $pdf->SetTitle(pdf_text("Attendance - " . $courseTitle));
    $pdf->SetAuthor("Tectigon Academy");
    $pdf->SetAutoPageBreak(true, 16);
    $pdf->AddPage();

    $pdf->SetFont("Arial", "B", 16);
    $pdf->Cell(0, 10, pdf_text("Attendance Report"), 0, 1, "L");

    $pdf->SetFont("Arial", "", 11);
    $pdf->Cell(0, 7, pdf_text("Course: " . $courseTitle), 0, 1, "L");
    if ($selectedStudentName !== "") {
        $pdf->Cell(0, 7, pdf_text("Student: " . $selectedStudentName), 0, 1, "L");
        $pdf->Cell(0, 7, pdf_text("Current Attendance Percentage: " . number_format($attendancePercentage, 2) . "%"), 0, 1, "L");
    } else {
        $pdf->Cell(0, 7, pdf_text("Student: All"), 0, 1, "L");
        $pdf->Ln(2);
        $pdf->SetFont("Arial", "B", 10);
        $pdf->SetFillColor(230, 234, 242);
        $pdf->Cell(100, 8, pdf_text("Student"), 1, 0, "L", true);
        $pdf->Cell(42, 8, pdf_text("Attendance %"), 1, 1, "L", true);
        $pdf->SetFont("Arial", "", 10);

        if (empty($studentPercentages)) {
            $pdf->Cell(142, 8, pdf_text("No submitted attendance found."), 1, 1, "L");
        } else {
            foreach ($studentPercentages as $studentPercentage) {
                $pdf->Cell(100, 8, pdf_text($studentPercentage["student_name"]), 1);
                $pdf->Cell(42, 8, pdf_text(number_format($studentPercentage["percentage"], 2) . "%"), 1, 1);
            }
        }
    }
    $pdf->Ln(4);

    $headers = ["Session", "Student", "Status", "Session Date", "Professor"];
    $widths = [46, 74, 32, 38, 82];

    $drawHeader = function () use ($pdf, $headers, $widths) {
        $pdf->SetFont("Arial", "B", 10);
        $pdf->SetFillColor(230, 234, 242);
        foreach ($headers as $index => $header) {
            $pdf->Cell($widths[$index], 9, pdf_text($header), 1, 0, "L", true);
        }
        $pdf->Ln();
        $pdf->SetFont("Arial", "", 10);
    };

    $drawHeader();

    if (empty($rows)) {
        $pdf->Cell(array_sum($widths), 9, pdf_text("No submitted attendance found."), 1, 1, "L");
    } else {
        foreach ($rows as $row) {
            if ($pdf->GetY() > 180) {
                $pdf->AddPage();
                $drawHeader();
            }

            $pdf->Cell($widths[0], 8, pdf_text(session_display_name($row)), 1);
            $pdf->Cell($widths[1], 8, pdf_text($row["student_name"] ?: ("Student #" . $row["student_id"])), 1);
            $pdf->Cell($widths[2], 8, pdf_text($row["status"] ?: "-"), 1);
            $pdf->Cell($widths[3], 8, pdf_text(format_date_only($row["session_date"])), 1);
            $pdf->Cell($widths[4], 8, pdf_text($row["professor_name"] ?: "-"), 1);
            $pdf->Ln();
        }
    }

    header("Content-Type: application/pdf");
    header("Content-Disposition: attachment; filename=\"" . $fileName . "\"");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    $pdf->Output("D", $fileName);
} catch (PDOException $e) {
    http_response_code(500);
    echo "Database error: " . $e->getMessage();
}
