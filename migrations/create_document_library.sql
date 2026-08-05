-- Biblioteca personal de documentos del secretario
CREATE TABLE IF NOT EXISTS document_library (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  uploaded_by VARCHAR(36) DEFAULT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER DEFAULT 0,
  category VARCHAR(100) DEFAULT 'general',
  tags JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_lib_institution ON document_library (institution_id);
CREATE INDEX idx_lib_category ON document_library (category);
CREATE INDEX idx_lib_uploaded_by ON document_library (uploaded_by);
