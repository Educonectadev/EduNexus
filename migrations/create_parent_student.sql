-- Luego crear la tabla parent_student
CREATE TABLE parent_student (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  parent_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  relationship ENUM('padre', 'madre', 'apoderado', 'tio', 'abuelo', 'hermano', 'otro') NOT NULL DEFAULT 'padre',
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_parent_student (parent_id, student_id),
  INDEX idx_ps_student (student_id),
  INDEX idx_ps_parent (parent_id),
  CONSTRAINT fk_ps_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
