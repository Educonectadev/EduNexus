-- Ensure notifications table has all required columns
-- (safe to run multiple times thanks to IF NOT EXISTS)

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS virtual_link VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agenda TEXT DEFAULT NULL;

-- Ensure notification_reads table exists
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
