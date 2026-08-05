-- ============================================================
-- EduconectaV2 — Datos de prueba para Supabase (PostgreSQL)
-- Ejecutar DESPUES del schema
-- Password hash para 'password123': $2b$10$PWn8L7b8s4B1WrXgkwFG/upkBCrK9lkqOc3HQFxqiM5Trg/3dxWRC
-- ============================================================

-- Plans (si no existen del schema)
INSERT INTO plans (id, name, description, price, max_users, max_students, features, status)
VALUES
  ('b5e9c1a0-2d3f-4a6b-8e7c-9f0d1a2b3c4e', 'Basico', 'Para instituciones pequenas', 299, 5, 100,
   '{"labels":["Acceso basico","5 usuarios","100 alumnos"]}', 'active'),
  ('c6f0d2b1-3e4a-5b7c-9f8d-0a1e2b3c4d5f', 'Estandar', 'Para instituciones en crecimiento', 599, 20, 500,
   '{"labels":["Acceso completo","20 usuarios","500 alumnos"]}', 'active'),
  ('d7a1e3c2-4f5b-6c8d-0a9e-1b2f3c4d5e6a', 'Premium', 'Para instituciones grandes', 999, 50, 2000,
   '{"labels":["Todo incluido","50 usuarios","2000 alumnos"]}', 'active'),
  ('a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'Diamante', 'Para instituciones de elite', 1499, 999999, 999999,
   '{"labels":["Acceso ilimitado"]}', 'active')
ON CONFLICT (id) DO NOTHING;

-- Institucion
INSERT INTO institutions (id, code, name, type, district, province, department, phone, email, status)
VALUES ('4a82156b-f9f6-4c26-aa54-5140e9e8bf96', 'COL01', 'IEP San Martin de Porres', 'colegio', 'San Martin de Porres', 'Lima', 'Lima', '01-555-1000', 'contacto@col01.edu.pe', 'active')
ON CONFLICT (id) DO NOTHING;

-- Usuarios (contrasena: password123)
INSERT INTO users (id, email, full_name, password_hash, role, institution_id, dni, phone, status)
VALUES
  ('8b9ba023-5089-426b-b348-2af0344620ca', 'admin@educonecta.pe', 'Admin General', '$2b$10$PWn8L7b8s4B1WrXgkwFG/upkBCrK9lkqOc3HQFxqiM5Trg/3dxWRC', 'super_admin', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '00000001', '999000001', 'active'),
  ('60753914-a859-4f07-b596-c938a5af6d8d', 'director@educonecta.pe', 'Carlos Director', '$2b$10$PWn8L7b8s4B1WrXgkwFG/upkBCrK9lkqOc3HQFxqiM5Trg/3dxWRC', 'director', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '00000002', '999000002', 'active'),
  ('d5efa415-53e9-4e96-9178-2d67a07fcb69', 'secretario@educonecta.pe', 'Maria Secretaria', '$2b$10$PWn8L7b8s4B1WrXgkwFG/upkBCrK9lkqOc3HQFxqiM5Trg/3dxWRC', 'secretario', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '00000003', '999000003', 'active'),
  ('3a3b2e10-d609-4197-9f40-3e242da550a4', 'docente@educonecta.pe', 'Juan Docente', '$2b$10$PWn8L7b8s4B1WrXgkwFG/upkBCrK9lkqOc3HQFxqiM5Trg/3dxWRC', 'docente', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '00000004', '999000004', 'active'),
  ('a1d74e61-bc98-40e0-80c9-2014bccd91b2', 'padre@educonecta.pe', 'Pedro Padre', '$2b$10$PWn8L7b8s4B1WrXgkwFG/upkBCrK9lkqOc3HQFxqiM5Trg/3dxWRC', 'padre', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '00000005', '999000005', 'active')
ON CONFLICT (email) DO NOTHING;

-- Docentes
INSERT INTO teachers (id, user_id, institution_id, code, first_name, last_name, email, status)
VALUES ('ec24759a-bc45-440c-bd80-dc336c7eebda', '3a3b2e10-d609-4197-9f40-3e242da550a4', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', 'DOC001', 'Juan', 'Docente', 'docente@educonecta.pe', 'active')
ON CONFLICT (id) DO NOTHING;

-- Alumnos
INSERT INTO students (id, institution_id, code, first_name, last_name, dni, grade, section, status)
VALUES
  ('16e61451-7a06-4c59-8ae8-ed01f5542001', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', 'ALU001', 'Alumno1', 'Apellido1', '10000001', '1ro', 'A', 'active'),
  ('1140cf8f-6a40-468d-bbdb-7f620b4adbec', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', 'ALU002', 'Alumno2', 'Apellido2', '10000002', '2do', 'A', 'active')
ON CONFLICT (id) DO NOTHING;

-- Cursos
INSERT INTO courses (id, institution_id, name, code, grade, section, teacher_id, status)
VALUES ('70d0b074-c5ca-4dca-9d54-e8683574b058', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', 'Matematica 1ro A', 'MAT1A', '1ro', 'A', '3a3b2e10-d609-4197-9f40-3e242da550a4', 'active')
ON CONFLICT (id) DO NOTHING;

-- Inscripciones
INSERT INTO enrollments (institution_id, student_id, course_id, grade, section, year, status)
VALUES ('4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '16e61451-7a06-4c59-8ae8-ed01f5542001', '70d0b074-c5ca-4dca-9d54-e8683574b058', '1ro', 'A', 2026, 'active')
ON CONFLICT DO NOTHING;

-- Horarios
INSERT INTO horarios (id, institution_id, course_id, teacher_id, day_of_week, start_time, end_time, classroom, status)
VALUES ('46304359-f6c1-4c05-b3df-8f47beca7486', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', '70d0b074-c5ca-4dca-9d54-e8683574b058', '3a3b2e10-d609-4197-9f40-3e242da550a4', 1, '08:00', '09:00', 'A-101', 'active')
ON CONFLICT DO NOTHING;

-- Padres
INSERT INTO parents (id, institution_id, first_name, last_name, document_number, email, phone, user_id, status)
VALUES ('b1c2d3e4-5f6a-4b7c-8d9e-0f1a2b3c4d5e', '4a82156b-f9f6-4c26-aa54-5140e9e8bf96', 'Pedro', 'Padre', '50000001', 'padre@educonecta.pe', '999000005', 'a1d74e61-bc98-40e0-80c9-2014bccd91b2', 'active')
ON CONFLICT DO NOTHING;

-- Relacion padre-alumno
INSERT INTO parent_student (parent_id, student_id, relationship, is_primary)
VALUES ('b1c2d3e4-5f6a-4b7c-8d9e-0f1a2b3c4d5e', '16e61451-7a06-4c59-8ae8-ed01f5542001', 'padre', true)
ON CONFLICT DO NOTHING;
