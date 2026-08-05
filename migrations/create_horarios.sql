CREATE TABLE IF NOT EXISTS horarios (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_horario_institution ON horarios (institution_id);
CREATE INDEX idx_horario_course ON horarios (course_id);
CREATE INDEX idx_horario_day ON horarios (day_of_week);
