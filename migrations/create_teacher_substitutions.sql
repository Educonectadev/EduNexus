-- ============================================================
-- Sustitución TEMPORAL de docentes
-- Cuando un docente falta un día concreto para un curso concreto,
-- otro docente lo sustituye en esa fecha SIN borrar al docente original
-- del curso (courses.teacher_id / horarios se mantienen intactos).
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_substitutions (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  original_teacher_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  substitute_teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_teacher_substitution UNIQUE (course_id, date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_substitutions_inst ON teacher_substitutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_teacher_substitutions_date ON teacher_substitutions(date);