import { Router } from "express";
import type Database from "better-sqlite3";
import {
  getStyleExamples,
  createStyleExample,
  deleteStyleExample,
} from "../db/repository.js";

export function styleRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(getStyleExamples(db));
  });

  router.post("/", (req, res) => {
    const { title, content, notes } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "title and content are required" });
      return;
    }
    const example = createStyleExample(db, {
      title,
      content,
      notes: notes ?? null,
    });
    res.status(201).json(example);
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    deleteStyleExample(db, id);
    res.json({ ok: true });
  });

  return router;
}
