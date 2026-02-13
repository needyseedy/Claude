import Parser from "rss-parser";
import type Database from "better-sqlite3";
import type { Source } from "../types/index.js";
import {
  createDevelopment,
  developmentExists,
  updateSourceChecked,
} from "../db/repository.js";
import { truncate } from "../utils/html.js";

const parser = new Parser({
  timeout: 15_000,
  headers: {
    "User-Agent": "PA-Flag-Tool/0.1 (UK Public Affairs Monitor)",
  },
});

/** Check a single RSS source for new items */
export async function checkRssSource(
  db: Database.Database,
  source: Source
): Promise<number> {
  let newCount = 0;

  try {
    const feed = await parser.parseURL(source.url);

    for (const item of feed.items) {
      const title = item.title?.trim() ?? "(no title)";

      // Skip if we've already seen this item from this source
      if (developmentExists(db, title, source.id!)) continue;

      const summary =
        item.contentSnippet?.trim() ?? item.content?.trim() ?? "";

      createDevelopment(db, {
        source_id: source.id!,
        title,
        summary: truncate(summary, 1000),
        url: item.link ?? null,
        raw_content: item.content ?? item.contentSnippet ?? "",
      });

      newCount++;
    }

    updateSourceChecked(db, source.id!);
  } catch (err) {
    console.error(`[rss] Error checking "${source.name}":`, err);
  }

  return newCount;
}

/** Check all enabled RSS sources */
export async function checkAllRssSources(
  db: Database.Database,
  sources: Source[]
): Promise<number> {
  const rssSources = sources.filter((s) => s.type === "rss");
  let totalNew = 0;

  for (const source of rssSources) {
    const n = await checkRssSource(db, source);
    if (n > 0) {
      console.log(`[rss] ${n} new items from "${source.name}"`);
    }
    totalNew += n;
  }

  return totalNew;
}
