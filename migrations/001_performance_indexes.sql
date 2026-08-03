-- ============================================================
-- Educonecta V1.1.1 - Performance Indexes Migration
-- Run this migration to add critical indexes for national scale
-- ============================================================

-- 1. Core multi-tenant indexes (institution_id on all tables)
-- These are CRITICAL for multi-tenant query performance

-- Students table
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_dni ON students(dni);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);

-- Enrollments table
CREATE INDEX IF NOT EXISTS idx_enrollments_institution ON enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_year ON enrollments(enrollment_year);

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Courses table
CREATE INDEX IF NOT EXISTS idx_courses_institution ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_courses_grade_section ON courses(grade, section);

-- Attendance table
CREATE INDEX IF NOT EXISTS idx_attendance_institution ON attendance(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- Grades table
CREATE INDEX IF NOT EXISTS idx_grades_institution ON grades(institution_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);

-- Payments table
CREATE INDEX IF NOT EXISTS idx_payments_institution ON payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

-- Documents table (if not exists)
CREATE INDEX IF NOT EXISTS idx_documents_institution ON documents(institution_id);

-- Certificates table (if not exists)
CREATE INDEX IF NOT EXISTS idx_certificates_institution ON certificates(institution_id);

-- 2. Composite indexes for common query patterns

-- Student search by name + institution
CREATE INDEX IF NOT EXISTS idx_students_inst_name ON students(institution_id, last_name, first_name);

-- Enrollment lookup by course + status
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);

-- Attendance by student + date range
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);

-- Grades by student + course
CREATE INDEX IF NOT EXISTS idx_grades_student_course ON grades(student_id, course_id);

-- 3. Chat messages indexes (for messaging performance)
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(receiver_id, is_read);

-- 4. Virtual classes indexes
CREATE INDEX IF NOT EXISTS idx_virtual_classes_institution ON virtual_classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_course ON virtual_classes(course_id);

-- 5. Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- 6. Horarios indexes
CREATE INDEX IF NOT EXISTS idx_horarios_course ON horarios(course_id);
CREATE INDEX IF NOT EXISTS idx_horarios_teacher ON horarios(teacher_id);

-- 7. Homework indexes
CREATE INDEX IF NOT EXISTS idx_homework_course ON homework(course_id);
CREATE INDEX IF NOT EXISTS idx_homework_due ON homework(due_date);

-- 8. Parent-student link indexes
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student(student_id);

-- 9. Institution plans and dashboards
CREATE INDEX IF NOT EXISTS idx_institutions_plan ON institutions(plan_id);
CREATE INDEX IF NOT EXISTS idx_institution_dashboards_inst ON institution_dashboards(institution_id);

-- 10. Full-text search indexes (for better search performance)
-- These enable MATCH() AGAINST() for faster text search
-- Uncomment if using MySQL 5.7+ with InnoDB
-- ALTER TABLE students ADD FULLTEXT INDEX ft_students_name (first_name, last_name);
-- ALTER TABLE users ADD FULLTEXT INDEX ft_users_name (full_name);

-- 11. Additional composite indexes for common national-scale queries
CREATE INDEX IF NOT EXISTS idx_students_inst_dni ON students(institution_id, dni);
CREATE INDEX IF NOT EXISTS idx_enrollments_inst_status ON enrollments(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_users_inst_role ON users(institution_id, role);
CREATE INDEX IF NOT EXISTS idx_courses_inst_status ON courses(institution_id, status);

-- 12. Index for sorting and pagination
CREATE INDEX IF NOT EXISTS idx_institutions_created ON institutions(created_at);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at);
