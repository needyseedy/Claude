import { Router } from "express";
import type Database from "better-sqlite3";
import {
  getAllDevelopments,
  getNewDevelopments,
  updateDevelopmentStatus,
} from "../db/repository.js";
import { generateAndSaveFlag } from "../services/flagwriter.js";

export function developmentsRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json(getAllDevelopments(db, limit));
  });

  router.get("/new", (_req, res) => {
    res.json(getNewDevelopments(db));
  });

  router.post("/:id/dismiss", (req, res) => {
    const id = parseInt(req.params.id);
    updateDevelopmentStatus(db, id, "dismissed");
    res.json({ ok: true });
  });

  router.post("/:id/generate-flag", async (req, res) => {
    const id = parseInt(req.params.id);
    const devs = getAllDevelopments(db, 999);
    const dev = devs.find((d) => d.id === id);
    if (!dev) {
      res.status(404).json({ error: "Development not found" });
      return;
    }
    try {
      await generateAndSaveFlag(db, dev);
      res.json({ ok: true });
    } catch (err) {
      console.error("[api] Error generating flag:", err);
      res.status(500).json({ error: "Failed to generate flag" });
    }
  });

  return router;
}
