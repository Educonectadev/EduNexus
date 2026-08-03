CREATE TABLE IF NOT EXISTS horarios (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1=Lunes, 2=Martes, 3=Miercoles, 4=Jueves, 5=Viernes',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_horario_institution (institution_id),
  INDEX idx_horario_course (course_id),
  INDEX idx_horario_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
