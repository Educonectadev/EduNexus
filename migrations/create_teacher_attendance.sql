CREATE TABLE IF NOT EXISTS teacher_attendance (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  teacher_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  check_in TIME DEFAULT NULL,
  check_out TIME DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present','late','absent','justified')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_teacher_date UNIQUE (teacher_id, date)
);
