-- Save which professor submitted each attendance session.

SET @submitted_by_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'training_sessions'
    AND column_name = 'submitted_by_professor_id'
);

SET @add_submitted_by_column = IF(
  @submitted_by_column_exists = 0,
  'ALTER TABLE training_sessions ADD COLUMN submitted_by_professor_id INT NULL AFTER submitted_after_seconds',
  'SELECT ''submitted_by_professor_id already exists; skipped column add'''
);
PREPARE add_submitted_by_column_stmt FROM @add_submitted_by_column;
EXECUTE add_submitted_by_column_stmt;
DEALLOCATE PREPARE add_submitted_by_column_stmt;

SET @submitted_by_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'training_sessions'
    AND index_name = 'idx_training_sessions_submitted_by_professor'
);

SET @add_submitted_by_index = IF(
  @submitted_by_index_exists = 0,
  'ALTER TABLE training_sessions ADD INDEX idx_training_sessions_submitted_by_professor (submitted_by_professor_id)',
  'SELECT ''idx_training_sessions_submitted_by_professor already exists; skipped index add'''
);
PREPARE add_submitted_by_index_stmt FROM @add_submitted_by_index;
EXECUTE add_submitted_by_index_stmt;
DEALLOCATE PREPARE add_submitted_by_index_stmt;

SET @submitted_by_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'training_sessions'
    AND constraint_name = 'fk_training_sessions_submitted_by_professor'
);

SET @add_submitted_by_fk = IF(
  @submitted_by_fk_exists = 0,
  'ALTER TABLE training_sessions ADD CONSTRAINT fk_training_sessions_submitted_by_professor FOREIGN KEY (submitted_by_professor_id) REFERENCES professors(id) ON DELETE SET NULL',
  'SELECT ''fk_training_sessions_submitted_by_professor already exists; skipped foreign key add'''
);
PREPARE add_submitted_by_fk_stmt FROM @add_submitted_by_fk;
EXECUTE add_submitted_by_fk_stmt;
DEALLOCATE PREPARE add_submitted_by_fk_stmt;
