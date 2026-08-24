-- Tabla notifications completa
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
  user_id VARCHAR(36) DEFAULT NULL,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'media',
  category VARCHAR(50) DEFAULT 'general',
  pinned BOOLEAN DEFAULT false,
  location VARCHAR(255) DEFAULT NULL,
  virtual_link VARCHAR(500) DEFAULT NULL,
  agenda TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notif_institution ON notifications (institution_id);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Tabla de lecturas por usuario
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads (user_id);

-- Trigger para notificaciones en tiempo real
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  SELECT json_build_object(
    'id', NEW.id,
    'user_id', COALESCE(NEW.user_id, ''),
    'institution_id', NEW.institution_id,
    'target_role', NEW.target_role,
    'type', NEW.type,
    'title', NEW.title,
    'message', left(COALESCE(NEW.message, ''), 180),
    'category', COALESCE(NEW.category, 'general'),
    'priority', COALESCE(NEW.priority, 'media'),
    'pinned', COALESCE(NEW.pinned, 0),
    'created_at', NEW.created_at
  )::text INTO payload;
  PERFORM pg_notify('edu_notifications', payload);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_notification ON notifications;
CREATE TRIGGER trg_notify_new_notification
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_new_notification();
