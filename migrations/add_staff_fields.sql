-- Agregar campos extendidos de contratación a la tabla users

ALTER TABLE users
  ADD COLUMN grade_level VARCHAR(100) DEFAULT '',
  ADD COLUMN specialization VARCHAR(255) DEFAULT '',
  ADD COLUMN contract_type VARCHAR(50) DEFAULT '';
