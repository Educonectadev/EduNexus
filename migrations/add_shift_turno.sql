-- Migración: columna TURNO para students, parents y enrollments
ALTER TABLE students ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT '';
ALTER TABLE parents ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT '';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT '';
COMMENT ON COLUMN students.shift IS 'Turno del alumno: mañana/tarde/noche';
COMMENT ON COLUMN parents.shift IS 'Turno del apoderado';
COMMENT ON COLUMN enrollments.shift IS 'Turno de la matrícula';
