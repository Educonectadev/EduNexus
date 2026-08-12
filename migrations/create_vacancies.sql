-- ============================================================
-- Capacidad de vacantes por grado + sección + año
-- El secretario define cuántas vacantes tiene cada grado/sección.
-- El ocupado se calcula de enrollments activos del mismo grade/section/year.
-- ============================================================

CREATE TABLE IF NOT EXISTS grade_section_vacancies (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  grade VARCHAR(100) NOT NULL,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_grade_section_vacancy UNIQUE (institution_id, grade, section, year)
);

CREATE INDEX IF NOT EXISTS idx_grade_section_vacancies_inst ON grade_section_vacancies(institution_id);