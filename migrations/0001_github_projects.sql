CREATE TABLE github_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER NOT NULL UNIQUE,
  full_name TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  homepage TEXT,
  avatar_url TEXT,
  language TEXT,
  license TEXT,
  topics TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  watchers INTEGER NOT NULL DEFAULT 0,
  open_issues INTEGER NOT NULL DEFAULT 0,
  stars_delta INTEGER NOT NULL DEFAULT 0,
  hot_score REAL NOT NULL DEFAULT 0,
  github_created_at TEXT,
  github_updated_at TEXT,
  pushed_at TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX github_projects_hot_score_idx ON github_projects(hot_score DESC);
CREATE INDEX github_projects_stars_idx ON github_projects(stars DESC);
CREATE INDEX github_projects_category_idx ON github_projects(category);
CREATE INDEX github_projects_language_idx ON github_projects(language);
CREATE INDEX github_projects_pushed_at_idx ON github_projects(pushed_at DESC);

CREATE TABLE github_project_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  forks INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES github_projects(id) ON DELETE CASCADE
);

CREATE INDEX github_project_snapshots_project_idx ON github_project_snapshots(project_id);
CREATE INDEX github_project_snapshots_captured_idx ON github_project_snapshots(captured_at DESC);

CREATE TABLE github_project_sync_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  query_count INTEGER NOT NULL DEFAULT 0,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE INDEX github_project_sync_jobs_started_idx ON github_project_sync_jobs(started_at DESC);
