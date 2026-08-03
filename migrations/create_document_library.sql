-- Biblioteca personal de documentos del secretario
CREATE TABLE IF NOT EXISTS document_library (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  uploaded_by VARCHAR(36) DEFAULT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT DEFAULT 0,
  category VARCHAR(100) DEFAULT 'general',
  tags JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lib_institution (institution_id),
  INDEX idx_lib_category (category),
  INDEX idx_lib_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
