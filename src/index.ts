import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, migrate, seedDefaults } from "./db/migrate.js";
import { loadConfig, validateConfig } from "./utils/config.js";
import { initAnthropicClient } from "./services/flagwriter.js";
import { initOutlookClient } from "./services/outlook.js";
import { startScheduler } from "./monitors/scheduler.js";
import { sourcesRouter } from "./routes/sources.js";
import { developmentsRouter } from "./routes/developments.js";
import { flagsRouter } from "./routes/flags.js";
import { styleRouter } from "./routes/style.js";
import { topicsRouter } from "./routes/topics.js";
import { monitorRouter } from "./routes/monitor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // ── Config ───────────────────────────────────────────────────────
  const config = loadConfig();
  const missing = validateConfig(config);
  if (missing.length > 0) {
    console.warn(
      `⚠ Missing env vars: ${missing.join(", ")}. Some features will be disabled.`
    );
  }

  // ── Database ─────────────────────────────────────────────────────
  const db = getDb();
  migrate(db);
  seedDefaults(db);
  console.log("[db] Ready");

  // ── Services ─────────────────────────────────────────────────────
  if (config.anthropicApiKey) {
    initAnthropicClient(config.anthropicApiKey);
  }
  await initOutlookClient(config);

  // ── Express ──────────────────────────────────────────────────────
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Serve the dashboard
  app.use(express.static(path.resolve(__dirname, "..", "public")));

  // API routes
  app.use("/api/sources", sourcesRouter(db));
  app.use("/api/developments", developmentsRouter(db));
  app.use("/api/flags", flagsRouter(db));
  app.use("/api/style-examples", styleRouter(db));
  app.use("/api/topics", topicsRouter(db));
  app.use("/api/monitor", monitorRouter(db, config));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      outlookConfigured: !!config.azureClientId,
      claudeConfigured: !!config.anthropicApiKey,
    });
  });

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "public", "index.html"));
  });

  // ── Start ────────────────────────────────────────────────────────
  app.listen(config.port, () => {
    console.log(`\n  PA Flag Tool running at http://localhost:${config.port}\n`);
  });

  // Start background monitoring
  startScheduler(db, config);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
