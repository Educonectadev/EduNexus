CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(36) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  user_name VARCHAR(150) DEFAULT NULL,
  user_id VARCHAR(36) DEFAULT NULL,
  institution_id VARCHAR(36) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_institution (institution_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
