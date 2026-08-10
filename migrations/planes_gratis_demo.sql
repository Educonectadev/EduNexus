-- Migración: planes Gratis y Demo como filas reales con trial_days
-- Ejecutar en Supabase SQL Editor.
-- 1) Agrega columna trial_days a plans (solo la primera vez)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER; -- NULL = plan pago (no vence), >0 = plan de prueba (cuenta días hábiles)

-- 2) Plan GRATIS (S/ 0, 20 días hábiles de prueba)
INSERT INTO plans (id, name, description, price, max_users, max_students, features, status, trial_days, created_at)
SELECT gen_random_uuid(), 'Gratis', 'Plan gratuito de 20 días hábiles para probar EduNexus.', 0, 5, 50,
       '{"matricula":true,"calificaciones":true,"asistencia":true,"comunicacion":true}'::jsonb, 'active', 20, now()
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Gratis');

-- 3) Plan DEMO (S/ 0, 15 días hábiles)
INSERT INTO plans (id, name, description, price, max_users, max_students, features, status, trial_days, created_at)
SELECT gen_random_uuid(), 'Demo', 'Plan de demostración de 15 días hábiles.', 0, 5, 50,
       '{"matricula":true,"calificaciones":true,"asistencia":true,"comunicacion":true}'::jsonb, 'active', 15, now()
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Demo');

-- Verificación
-- SELECT id, name, price, trial_days, status FROM plans ORDER BY price ASC, name ASC;