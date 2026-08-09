-- ============================================================
-- EduconectaV2 — Migración: demo_requests con estado + acciones
-- Copiar y pegar en Supabase SQL Editor → Run
-- ============================================================

ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS demo_date TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE SET NULL;

-- Normaliza solicitudes existentes a 'pending'
UPDATE demo_requests SET status = 'pending' WHERE status IS NULL OR status = '';

CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
