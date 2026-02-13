import { Router } from "express";
import type Database from "better-sqlite3";
import type { AppConfig } from "../types/index.js";
import { runMonitoringCycle } from "../monitors/scheduler.js";
import { getNewDevelopments } from "../db/repository.js";
import { generateAndSaveFlag } from "../services/flagwriter.js";

export function monitorRouter(
  db: Database.Database,
  config: AppConfig
): Router {
  const router = Router();

  /** Manually trigger a monitoring cycle */
  router.post("/scan", async (_req, res) => {
    try {
      const result = await runMonitoringCycle(db, config);
      res.json({
        ok: true,
        newItems: result.rssNew + result.outlookNew,
        rssNew: result.rssNew,
        outlookNew: result.outlookNew,
      });
    } catch (err) {
      console.error("[api] Scan error:", err);
      res.status(500).json({ error: "Scan failed" });
    }
  });

  /** Generate flags for all new developments */
  router.post("/generate-all", async (_req, res) => {
    try {
      const newDevs = getNewDevelopments(db);
      let generated = 0;

      for (const dev of newDevs) {
        await generateAndSaveFlag(db, dev);
        generated++;
      }

      res.json({ ok: true, processed: newDevs.length, generated });
    } catch (err) {
      console.error("[api] Generate-all error:", err);
      res.status(500).json({ error: "Generation failed" });
    }
  });

  return router;
}
