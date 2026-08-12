-- ============================================================
-- Pagos del PLAN ADQUIRIDO por la institución (SaaS EduNexus)
-- Muy aparte de los pagos de padres (matrículas/mensualidades).
-- Registro MANUAL con voucher: transferencia/depósito.
-- ============================================================

CREATE TABLE IF NOT EXISTS institution_plan_payments (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  plan_id VARCHAR(36) REFERENCES plans(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_date DATE DEFAULT NULL,
  method VARCHAR(50) DEFAULT '',
  voucher_ref VARCHAR(200) DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_institution_plan_payment UNIQUE (institution_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_plan_payments_inst ON institution_plan_payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_plan_payments_year ON institution_plan_payments(institution_id, year, month);