import { Router } from "express";
import type Database from "better-sqlite3";
import {
  getAllSources,
  createSource,
  toggleSource,
  deleteSource,
} from "../db/repository.js";

export function sourcesRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(getAllSources(db));
  });

  router.post("/", (req, res) => {
    const { name, type, url } = req.body;
    if (!name || !type || !url) {
      res.status(400).json({ error: "name, type, and url are required" });
      return;
    }
    const source = createSource(db, { name, type, url, enabled: true });
    res.status(201).json(source);
  });

  router.patch("/:id/toggle", (req, res) => {
    const id = parseInt(req.params.id);
    const { enabled } = req.body;
    toggleSource(db, id, !!enabled);
    res.json({ ok: true });
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    deleteSource(db, id);
    res.json({ ok: true });
  });

  return router;
}
