import cron from "node-cron";
import type Database from "better-sqlite3";
import type { AppConfig } from "../types/index.js";
import { getEnabledSources } from "../db/repository.js";
import { checkAllRssSources } from "./rss.js";
import { checkOutlookSource } from "./outlook.js";

let task: cron.ScheduledTask | null = null;

/** Run a single monitoring cycle across all enabled sources */
export async function runMonitoringCycle(
  db: Database.Database,
  config: AppConfig
): Promise<{ rssNew: number; outlookNew: number }> {
  const sources = getEnabledSources(db);
  console.log(
    `[monitor] Running cycle — ${sources.length} enabled sources`
  );

  const rssNew = await checkAllRssSources(db, sources);

  let outlookNew = 0;
  const outlookSource = sources.find((s) => s.type === "outlook");
  if (outlookSource) {
    outlookNew = await checkOutlookSource(
      db,
      outlookSource,
      config.monitorIntervalMinutes
    );
  }

  if (rssNew + outlookNew > 0) {
    console.log(
      `[monitor] Cycle complete — ${rssNew} RSS + ${outlookNew} Outlook new items`
    );
  } else {
    console.log("[monitor] Cycle complete — no new items");
  }

  return { rssNew, outlookNew };
}

/** Start the scheduled monitoring cron job */
export function startScheduler(
  db: Database.Database,
  config: AppConfig
): void {
  const minutes = config.monitorIntervalMinutes;
  const cronExpr = `*/${minutes} * * * *`;

  console.log(`[monitor] Scheduling every ${minutes} minutes (${cronExpr})`);

  task = cron.schedule(cronExpr, () => {
    runMonitoringCycle(db, config).catch((err) =>
      console.error("[monitor] Cycle error:", err)
    );
  });
}

/** Stop the scheduler */
export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
