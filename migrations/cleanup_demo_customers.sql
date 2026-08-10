-- ============================================================
-- Limpieza: solicitudes de demo de colegios que YA tienen plan
-- (no deben aparecer como solicitudes). Ejecutar en Supabase.
-- ============================================================

UPDATE demo_requests d
SET status = 'completed',
    notes = COALESCE(d.notes, '') || ' | Ya es cliente con plan activo (auto-marcado)'
WHERE d.status <> 'completed'
  AND (
    -- Institución ya creada desde esta solicitud y con plan
    EXISTS (SELECT 1 FROM institutions i WHERE i.id = d.institution_id AND i.plan_id IS NOT NULL)
    -- Institución existente con el mismo correo y con plan
    OR EXISTS (SELECT 1 FROM institutions i
               WHERE i.status = 'active' AND i.plan_id IS NOT NULL
                 AND LOWER(TRIM(i.email)) = LOWER(TRIM(d.email)))
    -- Institución existente con el mismo nombre y con plan
    OR EXISTS (SELECT 1 FROM institutions i
               WHERE i.status = 'active' AND i.plan_id IS NOT NULL
                 AND translate(LOWER(TRIM(i.name)), 'áéíóúü', 'aeiou')
                   = translate(LOWER(TRIM(d.institution_name)), 'áéíóúü', 'aeiou'))
    -- Usuario activo con el mismo correo
    OR EXISTS (SELECT 1 FROM users u
               WHERE u.status = 'active' AND LOWER(TRIM(u.email)) = LOWER(TRIM(d.email)))
  );