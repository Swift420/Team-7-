CREATE TABLE editor_users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (length(btrim(username)) > 0),
  password_hash text NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  title text NOT NULL,
  avatar text,
  role text NOT NULL DEFAULT 'editor' CHECK (role = 'editor'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Development/demo seed accounts. Password for all three is: editor123
INSERT INTO editor_users (id, username, password_hash, name, email, title, avatar) VALUES
  ('user-editor-1', 'sarah', 'ef5e5a1fb95055e0e56cccf98a41e784a132c14e7f6e1ba244302f0e72b29baf', 'Sarah Jenkins', 'sarah.editor@journal.io', 'Lead Editor, Tech & Data', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80'),
  ('user-editor-2', 'marcus', 'ef5e5a1fb95055e0e56cccf98a41e784a132c14e7f6e1ba244302f0e72b29baf', 'Marcus Vance', 'marcus.writer@journal.io', 'Senior Investigative Editor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'),
  ('user-editor-3', 'elena', 'ef5e5a1fb95055e0e56cccf98a41e784a132c14e7f6e1ba244302f0e72b29baf', 'Elena Rostova', 'elena.dev@journal.io', 'Visual Journalism & AI Editor', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80')
ON CONFLICT (username) DO NOTHING;
