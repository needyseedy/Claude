import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "pa-flags.db");

export function getDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('rss', 'outlook', 'webpage')),
      url TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_checked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS developments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL REFERENCES sources(id),
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      url TEXT,
      raw_content TEXT NOT NULL,
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'flagged', 'dismissed'))
    );

    CREATE TABLE IF NOT EXISTS flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      development_id INTEGER NOT NULL REFERENCES developments(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      client_tags TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'reviewed', 'sent')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS style_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_developments_status ON developments(status);
    CREATE INDEX IF NOT EXISTS idx_developments_detected ON developments(detected_at);
    CREATE INDEX IF NOT EXISTS idx_flags_status ON flags(status);
  `);
}

/** Seed default UK public affairs sources */
export function seedDefaults(db: Database.Database): void {
  const count = db
    .prepare("SELECT COUNT(*) as c FROM sources")
    .get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare(
    "INSERT INTO sources (name, type, url, enabled) VALUES (?, ?, ?, 1)"
  );

  const defaults: [string, string, string][] = [
    [
      "UK Parliament - Commons Hansard",
      "rss",
      "https://hansard.parliament.uk/rss/Commons/LatestSittings.rss",
    ],
    [
      "UK Parliament - Lords Hansard",
      "rss",
      "https://hansard.parliament.uk/rss/Lords/LatestSittings.rss",
    ],
    [
      "UK Parliament - Bills",
      "rss",
      "https://bills.parliament.uk/rss/allbills.rss",
    ],
    [
      "GOV.UK - All Publications",
      "rss",
      "https://www.gov.uk/search/all.atom",
    ],
    [
      "GOV.UK - Press Releases",
      "rss",
      "https://www.gov.uk/search/news-and-communications.atom",
    ],
    [
      "UK Parliament - Written Questions",
      "rss",
      "https://questions-statements.parliament.uk/rss/writtenquestions",
    ],
    [
      "UK Parliament - Written Statements",
      "rss",
      "https://questions-statements.parliament.uk/rss/writtenstatements",
    ],
    ["Outlook Inbox", "outlook", "inbox"],
  ];

  const insertMany = db.transaction(() => {
    for (const [name, type, url] of defaults) {
      insert.run(name, type, url);
    }
  });
  insertMany();
}

// Run directly: tsx src/db/migrate.ts
if (process.argv[1]?.endsWith("migrate.ts")) {
  const db = getDb();
  migrate(db);
  seedDefaults(db);
  console.log("Database migrated and seeded.");
  db.close();
}
