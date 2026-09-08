CREATE TYPE visualization_status AS ENUM ('approved');

CREATE TABLE article_visualizations (
  id uuid PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  status visualization_status NOT NULL DEFAULT 'approved',
  placement_after_element_id text NOT NULL,
  specification jsonb NOT NULL CHECK (jsonb_typeof(specification) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX article_visualizations_article_idx ON article_visualizations (article_id, created_at);

CREATE TRIGGER article_visualizations_set_updated_at
BEFORE UPDATE ON article_visualizations
FOR EACH ROW EXECUTE FUNCTION set_articles_updated_at();
