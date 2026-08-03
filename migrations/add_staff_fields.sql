-- Agregar campos extendidos de contratación a la tabla users
-- Ejecutar: mysql -u root educonecta < migrations/add_staff_fields.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS grade_level VARCHAR(100) DEFAULT '' AFTER subject,
  ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT '' AFTER grade_level,
  ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50) DEFAULT '' AFTER specialization;
