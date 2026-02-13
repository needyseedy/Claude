import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "../db/migrate.js";
import {
  createSource,
  getAllSources,
  toggleSource,
  createDevelopment,
  developmentExists,
  getNewDevelopments,
  updateDevelopmentStatus,
  createFlag,
  getAllFlags,
  updateFlag,
  createStyleExample,
  getStyleExamples,
  createClientTopic,
  getClientTopics,
  getEnabledClientTopics,
} from "../db/repository.js";

let db: Database.Database;

beforeEach(() => {
  db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  migrate(db);
});

afterEach(() => {
  db.close();
});

describe("sources", () => {
  it("creates and lists sources", () => {
    createSource(db, { name: "Test RSS", type: "rss", url: "https://example.com/rss", enabled: true });
    const sources = getAllSources(db);
    expect(sources).toHaveLength(1);
    expect(sources[0].name).toBe("Test RSS");
    expect(sources[0].type).toBe("rss");
  });

  it("toggles source enabled state", () => {
    const src = createSource(db, { name: "Test", type: "rss", url: "https://x.com", enabled: true });
    toggleSource(db, src.id!, false);
    const sources = getAllSources(db);
    expect(sources[0].enabled).toBe(0);
  });
});

describe("developments", () => {
  it("creates developments and checks existence", () => {
    const src = createSource(db, { name: "S", type: "rss", url: "https://x.com", enabled: true });
    createDevelopment(db, {
      source_id: src.id!,
      title: "Big news",
      summary: "Something happened",
      url: "https://example.com",
      raw_content: "Full text here",
    });

    expect(developmentExists(db, "Big news", src.id!)).toBe(true);
    expect(developmentExists(db, "Other news", src.id!)).toBe(false);

    const newDevs = getNewDevelopments(db);
    expect(newDevs).toHaveLength(1);
    expect(newDevs[0].status).toBe("new");
  });

  it("updates development status", () => {
    const src = createSource(db, { name: "S", type: "rss", url: "https://x.com", enabled: true });
    const dev = createDevelopment(db, {
      source_id: src.id!,
      title: "News",
      summary: "Summary",
      url: null,
      raw_content: "Content",
    });
    updateDevelopmentStatus(db, dev.id!, "flagged");
    const devs = getNewDevelopments(db);
    expect(devs).toHaveLength(0);
  });
});

describe("flags", () => {
  it("creates and updates flags", () => {
    const src = createSource(db, { name: "S", type: "rss", url: "https://x.com", enabled: true });
    const dev = createDevelopment(db, {
      source_id: src.id!,
      title: "Dev",
      summary: "Sum",
      url: null,
      raw_content: "Content",
    });
    const flag = createFlag(db, {
      development_id: dev.id!,
      title: "FLAG TITLE",
      content: "Flag body here",
      client_tags: "ClientA, ClientB",
      status: "draft",
    });

    expect(flag.title).toBe("FLAG TITLE");

    updateFlag(db, flag.id!, { status: "reviewed" });
    const flags = getAllFlags(db);
    expect(flags[0].status).toBe("reviewed");
  });
});

describe("style examples", () => {
  it("creates and lists style examples", () => {
    createStyleExample(db, { title: "Example 1", content: "Flag content here", notes: "Good tone" });
    const examples = getStyleExamples(db);
    expect(examples).toHaveLength(1);
    expect(examples[0].notes).toBe("Good tone");
  });
});

describe("client topics", () => {
  it("creates topics and filters enabled", () => {
    createClientTopic(db, { name: "AI Reg", keywords: "AI, DSIT", description: "AI regulation", enabled: true });
    createClientTopic(db, { name: "Housing", keywords: "planning", description: "Housing policy", enabled: false });

    expect(getClientTopics(db)).toHaveLength(2);
    expect(getEnabledClientTopics(db)).toHaveLength(1);
    expect(getEnabledClientTopics(db)[0].name).toBe("AI Reg");
  });
});
