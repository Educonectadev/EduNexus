ALTER TABLE enrollments ADD COLUMN academic_condition VARCHAR(20) DEFAULT 'studying';
-- 'studying' (en curso), 'promoted' (aprobado/promovido), 'repeating' (repitente), 'recovery' (recuperación)
