-- ============================================================
-- Notificaciones push (web-push): almacén de suscripciones
-- Ejecutar en el SQL Editor de Supabase
--
-- IMPORTANTE: una fila POR USUARIO por endpoint (dispositivo/navegador).
-- El endpoint es único por navegador, pero cada cuenta (gmail/padre/
-- docente/colegio) tiene su propia fila y su propio botón act/desact.
-- Ejecutar SIEMPRE (es idempotente, incluye ALTER por si ya existía
-- la versión anterior con UNIQUE(endpoint)).
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Si ya existía la versión con UNIQUE(endpoint), la convierte a UNIQUE(endpoint, user_id)
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_key;
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_user_key;
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_user_key UNIQUE (endpoint, user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);