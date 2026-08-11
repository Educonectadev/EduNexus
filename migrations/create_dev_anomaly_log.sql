-- ============================================================
-- Registro de anomalías detectadas por la auditoría DEV
-- (evita notificar dos veces la misma anomalía y guarda su historial).
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS dev_anomaly_log (
  id VARCHAR(36) PRIMARY KEY,
  anomaly_key VARCHAR(200) NOT NULL UNIQUE,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'media',
  title VARCHAR(255) NOT NULL,
  detail TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_dev_anomaly_status ON dev_anomaly_log(status);
CREATE INDEX IF NOT EXISTS idx_dev_anomaly_inst ON dev_anomaly_log(institution_id);