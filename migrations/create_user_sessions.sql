CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  institution_id VARCHAR(36) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logged_out_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_session_user ON user_sessions (user_id);
CREATE INDEX idx_session_institution ON user_sessions (institution_id);
CREATE INDEX idx_session_logged_in ON user_sessions (logged_in_at);
