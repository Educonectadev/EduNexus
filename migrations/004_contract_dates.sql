-- Fechas de contrato del personal: permiten mostrar vigencia y antigüedad
-- en el perfil (Mi perfil -> Colegio y contrato) y detectar contratos vencidos.
-- PostgreSQL / Supabase

ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_end_date DATE;
