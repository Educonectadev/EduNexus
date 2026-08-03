CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT DEFAULT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  target_role VARCHAR(50) DEFAULT 'all',
  status VARCHAR(20) DEFAULT 'active',
  meeting_date DATE DEFAULT NULL,
  meeting_time TIME DEFAULT NULL,
  institution_id VARCHAR(36) DEFAULT NULL,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_type (type),
  INDEX idx_notif_institution (institution_id),
  INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
