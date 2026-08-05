-- Primero crear la tabla parents
DROP TABLE IF EXISTS parent_student;
DROP TABLE IF EXISTS parents;

CREATE TABLE parents (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  document_type VARCHAR(20) DEFAULT 'DNI',
  document_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  occupation VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_parent_dni_inst UNIQUE (document_number, institution_id)
);
CREATE INDEX idx_parent_institution ON parents (institution_id);
CREATE INDEX idx_parent_name ON parents (first_name, last_name);
