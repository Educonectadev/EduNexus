CREATE TABLE IF NOT EXISTS academic_grades (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL DEFAULT '',
  year_number INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS academic_sections (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

ALTER TABLE institutions ADD COLUMN niveles JSONB DEFAULT '["Primaria","Secundaria"]';
