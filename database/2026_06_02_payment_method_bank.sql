-- Add "Bank" as a new payment method while keeping old "All" records unchanged.

ALTER TABLE student_payments
MODIFY payment_method ENUM('Bank','All','Divided','POS','Cash','Did not pay','Free') NOT NULL;

SET @student_course_payments_exists = (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'student_course_payments'
);

SET @alter_student_course_payments = IF(
  @student_course_payments_exists > 0,
  "ALTER TABLE student_course_payments MODIFY payment_method ENUM('Bank','All','Divided','POS','Cash','Did not pay','Free') NOT NULL",
  "SELECT 'student_course_payments table not found; skipped enum update'"
);
PREPARE alter_student_course_payments_stmt FROM @alter_student_course_payments;
EXECUTE alter_student_course_payments_stmt;
DEALLOCATE PREPARE alter_student_course_payments_stmt;
