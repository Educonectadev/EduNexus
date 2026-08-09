-- Migración: sistema de prueba (trial) de 20 días hábiles para instituciones gratuitas
-- Ejecutar en el SQL Editor de Supabase.
-- Eduardo, corre esto primero:

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP DEFAULT NULL;

CREATE TABLE IF NOT EXISTS trial_requests (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(200) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(30) DEFAULT '',
  institution_name VARCHAR(255) DEFAULT '',
  message TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'pending', -- pending | contacted | resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trial_requests_status ON trial_requests(status);
CREATE INDEX IF NOT EXISTS idx_trial_requests_created ON trial_requests(created_at);