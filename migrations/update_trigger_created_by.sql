-- Add created_by to notification trigger payload for detailed push notifications
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
DECLARE payload TEXT;
BEGIN
  SELECT json_build_object(
    'id', NEW.id,
    'user_id', COALESCE(NEW.user_id, ''),
    'institution_id', NEW.institution_id,
    'created_by', COALESCE(NEW.created_by, ''),
    'target_role', NEW.target_role,
    'type', NEW.type,
    'title', NEW.title,
    'message', left(COALESCE(NEW.message, ''), 180),
    'category', COALESCE(NEW.category, 'general'),
    'priority', COALESCE(NEW.priority, 'media'),
    'pinned', COALESCE(NEW.pinned, false),
    'created_at', NEW.created_at
  )::text INTO payload;
  PERFORM pg_notify('edu_notifications', payload);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
