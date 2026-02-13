import { Router } from "express";
import type Database from "better-sqlite3";
import {
  getClientTopics,
  createClientTopic,
  updateClientTopic,
  deleteClientTopic,
} from "../db/repository.js";

export function topicsRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(getClientTopics(db));
  });

  router.post("/", (req, res) => {
    const { name, keywords, description } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const topic = createClientTopic(db, {
      name,
      keywords: keywords ?? "",
      description: description ?? "",
      enabled: true,
    });
    res.status(201).json(topic);
  });

  router.patch("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    updateClientTopic(db, id, req.body);
    res.json({ ok: true });
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    deleteClientTopic(db, id);
    res.json({ ok: true });
  });

  return router;
}
