ALTER TABLE articles ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'published';
ALTER TABLE articles ADD CONSTRAINT articles_publication_status_check CHECK (publication_status IN ('draft', 'published'));
CREATE INDEX IF NOT EXISTS articles_publication_status_idx ON articles (publication_status);
