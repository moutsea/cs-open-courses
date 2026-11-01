-- Runtime AI channel managed from /admin/settings and read by GitHub Actions.
CREATE TABLE IF NOT EXISTS course_ai_channel (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  base_url TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
