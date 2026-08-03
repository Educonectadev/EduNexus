-- Documentos escolares (solicitud/gestión de documentos)
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) DEFAULT NULL,
  type VARCHAR(100) NOT NULL,
  status ENUM('pending','approved','rejected','ready') NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_doc_institution (institution_id),
  INDEX idx_doc_student (student_id),
  INDEX idx_doc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Certificados emitidos
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) DEFAULT NULL,
  student_name VARCHAR(200) NOT NULL,
  type VARCHAR(100) NOT NULL,
  issue_date DATE DEFAULT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  status ENUM('emitido','pendiente','anulado') NOT NULL DEFAULT 'emitido',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_cert_institution (institution_id),
  INDEX idx_cert_student (student_id),
  INDEX idx_cert_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
