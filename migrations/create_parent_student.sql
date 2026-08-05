-- Luego crear la tabla parent_student
CREATE TABLE parent_student (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  relationship VARCHAR(20) NOT NULL DEFAULT 'padre' CHECK (relationship IN ('padre','madre','apoderado','tio','abuelo','hermano','otro')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_parent_student UNIQUE (parent_id, student_id),
  CONSTRAINT fk_ps_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE INDEX idx_ps_student ON parent_student (student_id);
CREATE INDEX idx_ps_parent ON parent_student (parent_id);
