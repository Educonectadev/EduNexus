-- Notificaciones en tiempo real
-- 1) Lecturas individuales por usuario (tipo "recibos de leído" estilo WhatsApp)
-- 2) Trigger que emite pg_notify('edu_notifications') al insertar una notificación
--    para que el servidor Socket.IO (server.ts) la transmita en vivo a sus destinatarios.

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads (user_id);

-- Trigger: al insertar una notificación, emitir un evento en canal 'edu_notifications'
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  SELECT json_build_object(
    'id', NEW.id,
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