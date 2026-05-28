<?php
require_once __DIR__ . "/audit_helpers.php";

function finance_json_input(): array {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function finance_forbidden(): void {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "Akses i paautorizuar në financa"]);
    exit;
}

function finance_actor(PDO $conn, ?array $data = null): array {
    $actor = is_array($data["actor"] ?? null) ? $data["actor"] : [];
    $actorId = isset($actor["id"]) ? (int)$actor["id"] : (isset($_GET["actor_id"]) ? (int)$_GET["actor_id"] : 0);

    if ($actorId < 1) {
        finance_forbidden();
    }

    $stmt = $conn->prepare("SELECT id, username, role FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([$actorId]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || $admin["role"] !== "superadmin") {
        finance_forbidden();
    }

    return [
        "id" => (int)$admin["id"],
        "username" => $admin["username"],
        "role" => $admin["role"],
    ];
}

function ensure_finance_tables(PDO $conn): void {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS company_expenses (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            bill_number VARCHAR(100) DEFAULT NULL,
            category VARCHAR(100) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            expense_date DATE NOT NULL,
            payment_method VARCHAR(100) DEFAULT NULL,
            description TEXT DEFAULT NULL,
            attachment_path VARCHAR(255) DEFAULT NULL,
            created_by INT DEFAULT NULL,
            updated_by INT DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_company_expense_date (expense_date),
            KEY idx_company_expense_category (category),
            KEY idx_company_expense_created_by (created_by),
            CONSTRAINT fk_company_expense_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
            CONSTRAINT fk_company_expense_updated_by FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS teacher_salary_payments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT DEFAULT NULL,
            course_id INT DEFAULT NULL,
            expected_amount DECIMAL(10,2) DEFAULT NULL,
            paid_amount DECIMAL(10,2) NOT NULL,
            remaining_amount DECIMAL(10,2) NOT NULL,
            status ENUM('unpaid','partially_paid','paid') NOT NULL DEFAULT 'unpaid',
            payment_date DATE NOT NULL,
            notes TEXT DEFAULT NULL,
            created_by INT DEFAULT NULL,
            updated_by INT DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_teacher_salary_teacher (teacher_id),
            KEY idx_teacher_salary_course (course_id),
            KEY idx_teacher_salary_date (payment_date),
            KEY idx_teacher_salary_status (status),
            CONSTRAINT fk_teacher_salary_teacher FOREIGN KEY (teacher_id) REFERENCES professors(id) ON DELETE SET NULL,
            CONSTRAINT fk_teacher_salary_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
            CONSTRAINT fk_teacher_salary_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
            CONSTRAINT fk_teacher_salary_updated_by FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $salaryColumns = $conn->query("SHOW COLUMNS FROM teacher_salary_payments")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($salaryColumns as $column) {
        if ($column["Field"] === "expected_amount" && strtoupper($column["Null"]) !== "YES") {
            $conn->exec("ALTER TABLE teacher_salary_payments MODIFY expected_amount DECIMAL(10,2) NULL DEFAULT NULL");
            break;
        }
    }
    $conn->exec("
        UPDATE teacher_salary_payments
        SET status = 'unpaid', remaining_amount = expected_amount
        WHERE expected_amount IS NOT NULL AND paid_amount <= 0
    ");

    $columns = $conn->query("SHOW COLUMNS FROM student_payments")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array("created_at", $columns, true)) {
        $conn->exec("ALTER TABLE student_payments ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP");
    }
}

function finance_income_amount_sql(string $alias = "sp"): string {
    return "
        CASE
            WHEN {$alias}.payment_method IN ('All','POS','Cash') THEN COALESCE({$alias}.amount_all, 0)
            WHEN {$alias}.payment_method = 'Divided' THEN COALESCE({$alias}.amount_month1, 0) + COALESCE({$alias}.amount_month2, 0)
            ELSE 0
        END
    ";
}

function finance_totals(PDO $conn, array $filters = []): array {
    ensure_finance_tables($conn);
    $incomeAmount = finance_income_amount_sql("sp");

    $dateFrom = trim($filters["date_from"] ?? "");
    $dateTo = trim($filters["date_to"] ?? "");
    $courseId = isset($filters["course_id"]) ? (int)$filters["course_id"] : 0;
    $status = trim($filters["status"] ?? "");

    $incomeWhere = [];
    $incomeParams = [];
    if ($dateFrom !== "") {
        $incomeWhere[] = "DATE(sp.created_at) >= ?";
        $incomeParams[] = $dateFrom;
    }
    if ($dateTo !== "") {
        $incomeWhere[] = "DATE(sp.created_at) <= ?";
        $incomeParams[] = $dateTo;
    }
    if ($courseId > 0) {
        $incomeWhere[] = "sp.course_id = ?";
        $incomeParams[] = $courseId;
    }
    if ($status === "paid") {
        $incomeWhere[] = "({$incomeAmount}) > 0";
    } elseif ($status === "unpaid") {
        $incomeWhere[] = "({$incomeAmount}) <= 0";
    } elseif ($status === "cash") {
        $incomeWhere[] = "sp.payment_method = 'Cash'";
    } elseif ($status === "pos") {
        $incomeWhere[] = "sp.payment_method = 'POS'";
    }
    $incomeSql = "SELECT COALESCE(SUM({$incomeAmount}), 0) FROM student_payments sp";
    if ($incomeWhere) {
        $incomeSql .= " WHERE " . implode(" AND ", $incomeWhere);
    }
    $incomeStmt = $conn->prepare($incomeSql);
    $incomeStmt->execute($incomeParams);
    $income = (float)$incomeStmt->fetchColumn();

    $expenseWhere = [];
    $expenseParams = [];
    if ($dateFrom !== "") {
        $expenseWhere[] = "expense_date >= ?";
        $expenseParams[] = $dateFrom;
    }
    if ($dateTo !== "") {
        $expenseWhere[] = "expense_date <= ?";
        $expenseParams[] = $dateTo;
    }
    $expenseSql = "SELECT COALESCE(SUM(amount), 0) FROM company_expenses";
    if ($expenseWhere) {
        $expenseSql .= " WHERE " . implode(" AND ", $expenseWhere);
    }
    $expenseStmt = $conn->prepare($expenseSql);
    $expenseStmt->execute($expenseParams);
    $expenses = (float)$expenseStmt->fetchColumn();

    $salaryWhere = [];
    $salaryParams = [];
    if ($dateFrom !== "") {
        $salaryWhere[] = "payment_date >= ?";
        $salaryParams[] = $dateFrom;
    }
    if ($dateTo !== "") {
        $salaryWhere[] = "payment_date <= ?";
        $salaryParams[] = $dateTo;
    }
    if ($courseId > 0) {
        $salaryWhere[] = "course_id = ?";
        $salaryParams[] = $courseId;
    }
    if (in_array($status, ["unpaid", "partially_paid", "paid"], true)) {
        $salaryWhere[] = "status = ?";
        $salaryParams[] = $status;
    }
    $salarySql = "SELECT COALESCE(SUM(paid_amount), 0) FROM teacher_salary_payments";
    if ($salaryWhere) {
        $salarySql .= " WHERE " . implode(" AND ", $salaryWhere);
    }
    $salaryStmt = $conn->prepare($salarySql);
    $salaryStmt->execute($salaryParams);
    $salaries = (float)$salaryStmt->fetchColumn();

    return [
        "total_income" => round($income, 2),
        "total_expenses" => round($expenses, 2),
        "total_teacher_salaries" => round($salaries, 2),
        "net_profit" => round($income - $expenses - $salaries, 2),
    ];
}
