CREATE TABLE visualization_approval_history (
  id uuid PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  actor text NOT NULL DEFAULT 'editor',
  action text NOT NULL CHECK (action IN ('saved', 'cleared')),
  visualizations jsonb NOT NULL CHECK (jsonb_typeof(visualizations) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX visualization_approval_history_article_idx ON visualization_approval_history (article_id, created_at DESC);
