CREATE TABLE IF NOT EXISTS student_cancellations (
  id INT NOT NULL AUTO_INCREMENT,
  waitlist_id INT DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  course_id INT DEFAULT NULL,
  amount_to_pay DECIMAL(10,2) DEFAULT NULL,
  extra_note TEXT DEFAULT NULL,
  canceled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  canceled_by INT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_student_cancellations_course (course_id),
  KEY idx_student_cancellations_email (email),
  KEY idx_student_cancellations_canceled_at (canceled_at),
  KEY idx_student_cancellations_canceled_by (canceled_by),
  CONSTRAINT fk_student_cancellations_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_student_cancellations_canceled_by
    FOREIGN KEY (canceled_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
