ALTER TABLE notifications
  ADD COLUMN priority VARCHAR(20) DEFAULT 'media',
  ADD COLUMN category VARCHAR(50) DEFAULT 'general',
  ADD COLUMN pinned BOOLEAN DEFAULT false;
