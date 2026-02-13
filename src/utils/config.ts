import dotenv from "dotenv";
import type { AppConfig } from "../types/index.js";

dotenv.config();

export function loadConfig(): AppConfig {
  return {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    azureClientId: process.env.AZURE_CLIENT_ID ?? "",
    azureClientSecret: process.env.AZURE_CLIENT_SECRET ?? "",
    azureTenantId: process.env.AZURE_TENANT_ID ?? "",
    port: parseInt(process.env.PORT ?? "3000", 10),
    monitorIntervalMinutes: parseInt(
      process.env.MONITOR_INTERVAL_MINUTES ?? "15",
      10
    ),
  };
}

export function validateConfig(config: AppConfig): string[] {
  const missing: string[] = [];
  if (!config.anthropicApiKey) missing.push("ANTHROPIC_API_KEY");
  return missing;
}
