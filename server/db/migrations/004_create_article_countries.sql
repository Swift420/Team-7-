CREATE TABLE article_countries (
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  country_code char(2) NOT NULL,
  country_name text NOT NULL,
  relevance_score numeric(5,4) NOT NULL DEFAULT 0,
  confidence numeric(5,4) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'rules' CHECK (source IN ('metadata', 'rules', 'gemini', 'editor')),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, country_code)
);

CREATE INDEX article_countries_country_idx ON article_countries (country_code, article_id);
CREATE INDEX article_countries_activity_idx ON article_countries (country_code, updated_at DESC);

CREATE TRIGGER article_countries_set_updated_at
BEFORE UPDATE ON article_countries
FOR EACH ROW EXECUTE FUNCTION set_articles_updated_at();
