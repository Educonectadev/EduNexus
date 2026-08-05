-- Documentos escolares (solicitud/gestión de documentos)
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) DEFAULT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','ready')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);
CREATE INDEX idx_doc_institution ON documents (institution_id);
CREATE INDEX idx_doc_student ON documents (student_id);
CREATE INDEX idx_doc_status ON documents (status);

-- Certificados emitidos
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) DEFAULT NULL,
  student_name VARCHAR(200) NOT NULL,
  type VARCHAR(100) NOT NULL,
  issue_date DATE DEFAULT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido','pendiente','anulado')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);
CREATE INDEX idx_cert_institution ON certificates (institution_id);
CREATE INDEX idx_cert_student ON certificates (student_id);
CREATE INDEX idx_cert_status ON certificates (status);
