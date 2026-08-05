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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_institution ON audit_logs (institution_id);
CREATE INDEX idx_audit_action ON audit_logs (action);
CREATE INDEX idx_audit_entity ON audit_logs (entity);
CREATE INDEX idx_audit_created ON audit_logs (created_at);
