-- Agregar columna de configuración de horarios a institutions
-- Permite definir turnos personalizados y horario general

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT NULL;

COMMENT ON COLUMN institutions.schedule_config IS 'Configuración de horarios: turnos con horas/grados y horario general';
