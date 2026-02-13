import type Database from "better-sqlite3";
import type { Source } from "../types/index.js";
import { fetchRecentEmails, emailToText } from "../services/outlook.js";
import {
  createDevelopment,
  developmentExists,
  updateSourceChecked,
} from "../db/repository.js";
import { truncate } from "../utils/html.js";

/** Check Outlook inbox for new relevant emails */
export async function checkOutlookSource(
  db: Database.Database,
  source: Source,
  intervalMinutes: number
): Promise<number> {
  let newCount = 0;

  try {
    const emails = await fetchRecentEmails(intervalMinutes);

    for (const email of emails) {
      const title = email.subject?.trim() ?? "(no subject)";

      if (developmentExists(db, title, source.id!)) continue;

      const plainText = emailToText(email);

      createDevelopment(db, {
        source_id: source.id!,
        title,
        summary: truncate(email.bodyPreview ?? "", 1000),
        url: email.webLink ?? null,
        raw_content: plainText,
      });

      newCount++;
    }

    updateSourceChecked(db, source.id!);
  } catch (err) {
    console.error(`[outlook] Error checking inbox:`, err);
  }

  return newCount;
}
