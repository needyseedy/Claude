import type Database from "better-sqlite3";
import type {
  Source,
  Development,
  Flag,
  StyleExample,
  ClientTopic,
} from "../types/index.js";

// ── Sources ──────────────────────────────────────────────────────────

export function getAllSources(db: Database.Database): Source[] {
  return db.prepare("SELECT * FROM sources ORDER BY name").all() as Source[];
}

export function getEnabledSources(db: Database.Database): Source[] {
  return db
    .prepare("SELECT * FROM sources WHERE enabled = 1 ORDER BY name")
    .all() as Source[];
}

export function createSource(
  db: Database.Database,
  source: Omit<Source, "id" | "created_at" | "last_checked_at">
): Source {
  const result = db
    .prepare(
      "INSERT INTO sources (name, type, url, enabled) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .get(source.name, source.type, source.url, source.enabled ? 1 : 0) as Source;
  return result;
}

export function updateSourceChecked(
  db: Database.Database,
  id: number
): void {
  db.prepare(
    "UPDATE sources SET last_checked_at = datetime('now') WHERE id = ?"
  ).run(id);
}

export function toggleSource(
  db: Database.Database,
  id: number,
  enabled: boolean
): void {
  db.prepare("UPDATE sources SET enabled = ? WHERE id = ?").run(
    enabled ? 1 : 0,
    id
  );
}

export function deleteSource(db: Database.Database, id: number): void {
  db.prepare("DELETE FROM sources WHERE id = ?").run(id);
}

// ── Developments ─────────────────────────────────────────────────────

export function getNewDevelopments(db: Database.Database): Development[] {
  return db
    .prepare(
      `SELECT d.*, s.name as source_name FROM developments d
       JOIN sources s ON d.source_id = s.id
       WHERE d.status = 'new'
       ORDER BY d.detected_at DESC`
    )
    .all() as Development[];
}

export function getAllDevelopments(
  db: Database.Database,
  limit = 100
): Development[] {
  return db
    .prepare(
      `SELECT d.*, s.name as source_name FROM developments d
       JOIN sources s ON d.source_id = s.id
       ORDER BY d.detected_at DESC LIMIT ?`
    )
    .all(limit) as Development[];
}

export function createDevelopment(
  db: Database.Database,
  dev: Omit<Development, "id" | "detected_at" | "status" | "source_name">
): Development {
  return db
    .prepare(
      `INSERT INTO developments (source_id, title, summary, url, raw_content)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      dev.source_id,
      dev.title,
      dev.summary,
      dev.url,
      dev.raw_content
    ) as Development;
}

export function developmentExists(
  db: Database.Database,
  title: string,
  sourceId: number
): boolean {
  const row = db
    .prepare(
      "SELECT 1 FROM developments WHERE title = ? AND source_id = ? LIMIT 1"
    )
    .get(title, sourceId);
  return !!row;
}

export function updateDevelopmentStatus(
  db: Database.Database,
  id: number,
  status: Development["status"]
): void {
  db.prepare("UPDATE developments SET status = ? WHERE id = ?").run(status, id);
}

// ── Flags ────────────────────────────────────────────────────────────

export function getAllFlags(db: Database.Database, limit = 100): Flag[] {
  return db
    .prepare("SELECT * FROM flags ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Flag[];
}

export function getFlagsByStatus(
  db: Database.Database,
  status: Flag["status"]
): Flag[] {
  return db
    .prepare("SELECT * FROM flags WHERE status = ? ORDER BY created_at DESC")
    .all(status) as Flag[];
}

export function createFlag(
  db: Database.Database,
  flag: Omit<Flag, "id" | "created_at" | "updated_at">
): Flag {
  return db
    .prepare(
      `INSERT INTO flags (development_id, title, content, client_tags, status)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      flag.development_id,
      flag.title,
      flag.content,
      flag.client_tags,
      flag.status
    ) as Flag;
}

export function updateFlag(
  db: Database.Database,
  id: number,
  updates: Partial<Pick<Flag, "title" | "content" | "client_tags" | "status">>
): void {
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: (string | number)[] = [];

  if (updates.title !== undefined) {
    sets.push("title = ?");
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    sets.push("content = ?");
    values.push(updates.content);
  }
  if (updates.client_tags !== undefined) {
    sets.push("client_tags = ?");
    values.push(updates.client_tags);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    values.push(updates.status);
  }

  values.push(id);
  db.prepare(`UPDATE flags SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteFlag(db: Database.Database, id: number): void {
  db.prepare("DELETE FROM flags WHERE id = ?").run(id);
}

// ── Style Examples ───────────────────────────────────────────────────

export function getStyleExamples(db: Database.Database): StyleExample[] {
  return db
    .prepare("SELECT * FROM style_examples ORDER BY created_at DESC")
    .all() as StyleExample[];
}

export function createStyleExample(
  db: Database.Database,
  example: Omit<StyleExample, "id" | "created_at">
): StyleExample {
  return db
    .prepare(
      "INSERT INTO style_examples (title, content, notes) VALUES (?, ?, ?) RETURNING *"
    )
    .get(example.title, example.content, example.notes) as StyleExample;
}

export function deleteStyleExample(
  db: Database.Database,
  id: number
): void {
  db.prepare("DELETE FROM style_examples WHERE id = ?").run(id);
}

// ── Client Topics ────────────────────────────────────────────────────

export function getClientTopics(db: Database.Database): ClientTopic[] {
  return db
    .prepare("SELECT * FROM client_topics ORDER BY name")
    .all() as ClientTopic[];
}

export function getEnabledClientTopics(
  db: Database.Database
): ClientTopic[] {
  return db
    .prepare("SELECT * FROM client_topics WHERE enabled = 1 ORDER BY name")
    .all() as ClientTopic[];
}

export function createClientTopic(
  db: Database.Database,
  topic: Omit<ClientTopic, "id">
): ClientTopic {
  return db
    .prepare(
      "INSERT INTO client_topics (name, keywords, description, enabled) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .get(topic.name, topic.keywords, topic.description, topic.enabled ? 1 : 0) as ClientTopic;
}

export function updateClientTopic(
  db: Database.Database,
  id: number,
  updates: Partial<Omit<ClientTopic, "id">>
): void {
  const sets: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.keywords !== undefined) {
    sets.push("keywords = ?");
    values.push(updates.keywords);
  }
  if (updates.description !== undefined) {
    sets.push("description = ?");
    values.push(updates.description);
  }
  if (updates.enabled !== undefined) {
    sets.push("enabled = ?");
    values.push(updates.enabled ? 1 : 0);
  }

  if (sets.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE client_topics SET ${sets.join(", ")} WHERE id = ?`).run(
    ...values
  );
}

export function deleteClientTopic(db: Database.Database, id: number): void {
  db.prepare("DELETE FROM client_topics WHERE id = ?").run(id);
}
