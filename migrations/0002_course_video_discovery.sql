CREATE TABLE IF NOT EXISTS course_video_job_state (
  id TEXT PRIMARY KEY CHECK (id = 'course-videos'),
  next_run_at INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  run_id TEXT
);

CREATE TABLE IF NOT EXISTS course_video_runs (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed', 'interrupted')),
  attempted INTEGER NOT NULL DEFAULT 0,
  accepted INTEGER NOT NULL DEFAULT 0,
  review INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS course_video_attempts (
  course_path TEXT PRIMARY KEY,
  checked_at INTEGER NOT NULL,
  run_id TEXT NOT NULL REFERENCES course_video_runs(id),
  status TEXT NOT NULL CHECK (status IN ('covered', 'review', 'not_found', 'partial', 'failed')),
  errors_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS course_video_candidates (
  course_path TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('accepted', 'review', 'rejected')),
  resource_json TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  checked_at INTEGER NOT NULL,
  run_id TEXT NOT NULL REFERENCES course_video_runs(id),
  PRIMARY KEY (course_path, url)
);
CREATE INDEX IF NOT EXISTS course_video_candidates_status ON course_video_candidates(status, course_path);
