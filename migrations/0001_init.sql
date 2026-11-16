CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  initialized INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meals (
  visitor_id TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (visitor_id, id)
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  picked_at TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_visitor ON meals (visitor_id, position);
CREATE INDEX IF NOT EXISTS idx_history_visitor ON history (visitor_id, position);
