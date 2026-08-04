-- Métodos de pago configurados por el secretario (visibles a padres)
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  type ENUM('efectivo','deposito','transferencia','yape','plin','otro') NOT NULL DEFAULT 'otro',
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(60) DEFAULT NULL,
  account_holder VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  details TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pm_institution (institution_id),
  INDEX idx_pm_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
