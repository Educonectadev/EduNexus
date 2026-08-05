-- Métodos de pago configurados por el secretario (visibles a padres)
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'otro' CHECK (type IN ('efectivo','deposito','transferencia','yape','plin','otro')),
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(60) DEFAULT NULL,
  account_holder VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  details TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pm_institution ON payment_methods (institution_id);
CREATE INDEX idx_pm_type ON payment_methods (type);
