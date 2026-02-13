import { Router } from "express";
import type Database from "better-sqlite3";
import {
  getAllFlags,
  getFlagsByStatus,
  updateFlag,
  deleteFlag,
} from "../db/repository.js";

export function flagsRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const status = req.query.status as string | undefined;
    if (status === "draft" || status === "reviewed" || status === "sent") {
      res.json(getFlagsByStatus(db, status));
    } else {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(getAllFlags(db, limit));
    }
  });

  router.patch("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { title, content, client_tags, status } = req.body;
    updateFlag(db, id, { title, content, client_tags, status });
    res.json({ ok: true });
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    deleteFlag(db, id);
    res.json({ ok: true });
  });

  return router;
}
