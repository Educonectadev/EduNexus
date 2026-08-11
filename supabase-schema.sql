-- ============================================================
-- EduconectaV2 — Schema completo para Supabase (PostgreSQL)
-- Copiar y pegar en Supabase SQL Editor → Run
-- ============================================================

-- =========================
-- 1. TABLAS BASE (sin FK)
-- =========================

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  max_users INTEGER DEFAULT 5,
  max_students INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS institutions (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'colegio',
  level VARCHAR(50) DEFAULT '',
  modality VARCHAR(50) DEFAULT '',
  shift VARCHAR(50) DEFAULT '',
  dependence VARCHAR(50) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  province VARCHAR(100) DEFAULT '',
  district VARCHAR(100) DEFAULT '',
  address VARCHAR(255) DEFAULT '',
  reference VARCHAR(255) DEFAULT '',
  phone VARCHAR(30) DEFAULT '',
  phone2 VARCHAR(30) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  website VARCHAR(255) DEFAULT '',
  director_name VARCHAR(200) DEFAULT '',
  director_dni VARCHAR(20) DEFAULT '',
  director_phone VARCHAR(30) DEFAULT '',
  director_email VARCHAR(255) DEFAULT '',
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  total_classrooms INTEGER DEFAULT 0,
  has_lab BOOLEAN DEFAULT false,
  has_library BOOLEAN DEFAULT false,
  has_computer_room BOOLEAN DEFAULT false,
  has_playground BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  logo_url VARCHAR(500) DEFAULT '',
  plan_id VARCHAR(36) REFERENCES plans(id) ON DELETE SET NULL,
  trial_ends_at TIMESTAMP DEFAULT NULL,
  niveles JSONB DEFAULT '["Primaria","Secundaria"]',
  schedule_config JSONB DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. TABLAS CON FK A institutions
-- =========================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  password VARCHAR(255) DEFAULT '',
  password_hash VARCHAR(255) DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'docente',
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  dni VARCHAR(20) DEFAULT '',
  phone VARCHAR(30) DEFAULT '',
  subject VARCHAR(100) DEFAULT '',
  avatar_url VARCHAR(500) DEFAULT '',
  document_number VARCHAR(20) DEFAULT '',
  grade_level VARCHAR(100) DEFAULT '',
  specialization VARCHAR(255) DEFAULT '',
  contract_type VARCHAR(50) DEFAULT '',
  last_login TIMESTAMP NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_user_role_inst UNIQUE (user_id, role, institution_id)
);

CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  code VARCHAR(20) DEFAULT '',
  first_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  code VARCHAR(20) DEFAULT '',
  student_code VARCHAR(20) DEFAULT '',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) DEFAULT '',
  dni VARCHAR(20) DEFAULT '',
  document_type VARCHAR(20) DEFAULT 'DNI',
  document_number VARCHAR(20) DEFAULT '',
  birth_date DATE DEFAULT NULL,
  gender VARCHAR(10) DEFAULT '',
  grade VARCHAR(20) DEFAULT '',
  section VARCHAR(10) DEFAULT 'A',
  photo_url VARCHAR(500) DEFAULT '',
  academic_condition VARCHAR(20) DEFAULT 'studying',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(20) DEFAULT '',
  grade VARCHAR(20) DEFAULT '',
  section VARCHAR(10) DEFAULT '',
  teacher_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id VARCHAR(36) REFERENCES courses(id) ON DELETE SET NULL,
  grade VARCHAR(20) DEFAULT '',
  grade_level VARCHAR(50) DEFAULT '',
  level VARCHAR(50) DEFAULT '',
  section VARCHAR(10) DEFAULT '',
  year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  academic_condition VARCHAR(20) DEFAULT 'studying',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS horarios (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present','late','absent','justified')),
  entry_time TIME DEFAULT NULL,
  exit_time TIME DEFAULT NULL,
  observation TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_attendance_student_date UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  period VARCHAR(20) DEFAULT '',
  score DECIMAL(5,2) DEFAULT 0,
  max_score DECIMAL(5,2) DEFAULT 20,
  notes TEXT DEFAULT '',
  subject_name VARCHAR(200) DEFAULT '',
  term VARCHAR(20) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  concept_id VARCHAR(36) REFERENCES payment_concepts(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_date DATE DEFAULT NULL,
  paid_date DATE DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','partial','paid','overdue')),
  reference VARCHAR(100) DEFAULT '',
  notes TEXT DEFAULT '',
  deleted_at TIMESTAMP DEFAULT NULL,
  delete_reason TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_concepts (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  type VARCHAR(50) DEFAULT 'monthly',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'otro' CHECK (type IN ('efectivo','deposito','transferencia','yape','plin','otro')),
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(60) DEFAULT NULL,
  account_holder VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  details TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','ready')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
  student_name VARCHAR(200) NOT NULL,
  type VARCHAR(100) NOT NULL,
  issue_date DATE DEFAULT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido','pendiente','anulado')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_library (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  uploaded_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER DEFAULT 0,
  category VARCHAR(100) DEFAULT 'general',
  tags JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issued_documents (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
  type VARCHAR(100) DEFAULT '',
  number VARCHAR(50) DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(36) REFERENCES courses(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS virtual_classes (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  meeting_url VARCHAR(500) DEFAULT '',
  platform VARCHAR(50) DEFAULT 'zoom',
  class_date DATE DEFAULT NULL,
  class_time TIME DEFAULT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT DEFAULT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  target_role VARCHAR(50) DEFAULT 'all',
  status VARCHAR(20) DEFAULT 'active',
  meeting_date DATE DEFAULT NULL,
  meeting_time TIME DEFAULT NULL,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'media',
  category VARCHAR(50) DEFAULT 'general',
  pinned BOOLEAN DEFAULT false,
  location VARCHAR(255) DEFAULT NULL,
  virtual_link VARCHAR(500) DEFAULT NULL,
  agenda TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homework (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  subject VARCHAR(200) DEFAULT '',
  start_date DATE DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','submitted','graded')),
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  student_id VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id VARCHAR(36) PRIMARY KEY,
  homework_id VARCHAR(36) NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','submitted','graded')),
  grade DECIMAL(5,2) DEFAULT NULL,
  feedback TEXT DEFAULT '',
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_hw_submission UNIQUE (homework_id, student_id)
);

CREATE TABLE IF NOT EXISTS course_materials (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  uploaded_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(255) DEFAULT '',
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parents (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  document_type VARCHAR(20) DEFAULT 'DNI',
  document_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  occupation VARCHAR(100) DEFAULT NULL,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_parent_dni_inst UNIQUE (document_number, institution_id)
);

CREATE TABLE IF NOT EXISTS parent_student (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id VARCHAR(36) NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(20) NOT NULL DEFAULT 'padre' CHECK (relationship IN ('padre','madre','apoderado','tio','abuelo','hermano','otro')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_parent_student UNIQUE (parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS teacher_attendance (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME DEFAULT NULL,
  check_out TIME DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present','late','absent','justified')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_teacher_date UNIQUE (teacher_id, date)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(36) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  user_name VARCHAR(150) DEFAULT NULL,
  user_id VARCHAR(36) DEFAULT NULL,
  institution_id VARCHAR(36) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id VARCHAR(36) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logged_out_at TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS institution_dashboards (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  type VARCHAR(50) DEFAULT 'main',
  role VARCHAR(50) DEFAULT 'director',
  config JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_grades (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL DEFAULT '',
  year_number INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_sections (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_periods (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  institution_name VARCHAR(255) DEFAULT '',
  institution_type VARCHAR(50) DEFAULT 'private',
  level VARCHAR(50) DEFAULT 'all',
  estimated_students INTEGER DEFAULT 0,
  message TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  demo_date TIMESTAMP DEFAULT NULL,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitudes de contratación (activación de plan tras trial vencido)
CREATE TABLE IF NOT EXISTS trial_requests (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(200) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(30) DEFAULT '',
  institution_name VARCHAR(255) DEFAULT '',
  message TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'pending', -- pending | contacted | resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 3. INDEXES (rendimiento)
-- =========================

-- institutions
CREATE INDEX IF NOT EXISTS idx_institutions_plan ON institutions(plan_id);
CREATE INDEX IF NOT EXISTS idx_institutions_created ON institutions(created_at);

-- trial_requests
CREATE INDEX IF NOT EXISTS idx_trial_requests_status ON trial_requests(status);
CREATE INDEX IF NOT EXISTS idx_trial_requests_created ON trial_requests(created_at);

-- users
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_inst_role ON users(institution_id, role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- teachers
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_institution ON teachers(institution_id);

-- students
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_dni ON students(dni);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_inst_name ON students(institution_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_inst_dni ON students(institution_id, dni);
CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_institution ON enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_year ON enrollments(year);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_inst_status ON enrollments(institution_id, status);

-- courses
CREATE INDEX IF NOT EXISTS idx_courses_institution ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_courses_grade_section ON courses(grade, section);
CREATE INDEX IF NOT EXISTS idx_courses_inst_status ON courses(institution_id, status);

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_institution ON attendance(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);

-- grades
CREATE INDEX IF NOT EXISTS idx_grades_institution ON grades(institution_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_course ON grades(student_id, course_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_institution ON payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

-- documents & certificates
CREATE INDEX IF NOT EXISTS idx_documents_institution ON documents(institution_id);
CREATE INDEX IF NOT EXISTS idx_certificates_institution ON certificates(institution_id);

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(receiver_id, is_read);

-- virtual_classes
CREATE INDEX IF NOT EXISTS idx_virtual_classes_institution ON virtual_classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_course ON virtual_classes(course_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- horarios
CREATE INDEX IF NOT EXISTS idx_horarios_institution ON horarios(institution_id);
CREATE INDEX IF NOT EXISTS idx_horarios_course ON horarios(course_id);
CREATE INDEX IF NOT EXISTS idx_horarios_teacher ON horarios(teacher_id);
CREATE INDEX IF NOT EXISTS idx_horarios_day ON horarios(day_of_week);

-- homework
CREATE INDEX IF NOT EXISTS idx_homework_course ON homework(course_id);
CREATE INDEX IF NOT EXISTS idx_homework_due ON homework(due_date);

-- parent_student
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student(student_id);

-- institution_dashboards
CREATE INDEX IF NOT EXISTS idx_institution_dashboards_inst ON institution_dashboards(institution_id);

-- =========================
-- 4. DATOS INICIALES (plans)
-- =========================

INSERT INTO plans (id, name, description, price, max_users, max_students, features, status)
VALUES
  ('b5e9c1a0-2d3f-4a6b-8e7c-9f0d1a2b3c4e', 'Basico', 'Para instituciones pequenas', 299, 5, 100,
   '{"labels":["Acceso basico","5 usuarios","100 alumnos"],"permissions":{"view_grades":true,"view_attendance":true}}', 'active'),
  ('c6f0d2b1-3e4a-5b7c-9f8d-0a1e2b3c4d5f', 'Estandar', 'Para instituciones en crecimiento', 599, 20, 500,
   '{"labels":["Acceso completo","20 usuarios","500 alumnos"],"permissions":{"manage_grades":true,"manage_attendance":true,"reports":true}}', 'active'),
  ('d7a1e3c2-4f5b-6c8d-0a9e-1b2f3c4d5e6a', 'Premium', 'Para instituciones grandes', 999, 50, 2000,
   '{"labels":["Todo incluido","50 usuarios","2000 alumnos","Soporte prioritario"],"permissions":{"all":true}}', 'active'),
  ('a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'Diamante', 'Para instituciones de elite', 1499, 999999, 999999,
   '{"labels":["Acceso ilimitado","Usuarios ilimitados","Alumnos ilimitados","Soporte 24/7"],"permissions":{"all":true,"super_admin":true}}', 'active')
ON CONFLICT (id) DO NOTHING;

-- =========================
-- 5. RLS (Row Level Security)
-- Descomentar si se usa Supabase Auth
-- =========================

-- ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- etc.

-- =========================
-- FIN DEL SCHEMA
-- =========================

-- =========================
-- NOTIFICACIONES PUSH (WEB PUSH)
-- =========================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (endpoint, user_id)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- =========================
-- REGISTRO DE ANOMALÍAS (auditoría DEV)
-- =========================
CREATE TABLE IF NOT EXISTS dev_anomaly_log (
  id VARCHAR(36) PRIMARY KEY,
  anomaly_key VARCHAR(200) NOT NULL UNIQUE,
  institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'media',
  title VARCHAR(255) NOT NULL,
  detail TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_dev_anomaly_status ON dev_anomaly_log(status);
CREATE INDEX IF NOT EXISTS idx_dev_anomaly_inst ON dev_anomaly_log(institution_id);
