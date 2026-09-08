CREATE TYPE article_source_format AS ENUM ('NZZ_JSON', 'MARKDOWN');

CREATE TABLE articles (
  id uuid PRIMARY KEY,
  import_key text NOT NULL UNIQUE,
  nzz_id text UNIQUE,
  document_id bigint,
  headline text NOT NULL CHECK (length(btrim(headline)) > 0),
  lead text,
  author_line text,
  section text,
  language varchar(16),
  source_url text,
  published_at timestamptz,
  body jsonb NOT NULL CHECK (jsonb_typeof(body) = 'array'),
  raw_content jsonb,
  source_format article_source_format NOT NULL,
  teaser_image jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(tags) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_published_at_idx ON articles (published_at DESC NULLS LAST);
CREATE INDEX articles_section_idx ON articles (section);
CREATE INDEX articles_body_gin_idx ON articles USING gin (body);

CREATE OR REPLACE FUNCTION set_articles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_set_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION set_articles_updated_at();
