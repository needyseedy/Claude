import {
  ConfidentialClientApplication,
  type Configuration,
} from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import type { AppConfig, OutlookEmail } from "../types/index.js";
import { stripHtml } from "../utils/html.js";

let graphClient: Client | null = null;

/** Initialise the Microsoft Graph client using client-credentials flow */
export async function initOutlookClient(config: AppConfig): Promise<boolean> {
  if (!config.azureClientId || !config.azureTenantId) {
    console.log(
      "[outlook] Azure credentials not configured — Outlook monitoring disabled"
    );
    return false;
  }

  const msalConfig: Configuration = {
    auth: {
      clientId: config.azureClientId,
      clientSecret: config.azureClientSecret,
      authority: `https://login.microsoftonline.com/${config.azureTenantId}`,
    },
  };

  const cca = new ConfidentialClientApplication(msalConfig);

  graphClient = Client.init({
    authProvider: async (done) => {
      try {
        const result = await cca.acquireTokenByClientCredential({
          scopes: ["https://graph.microsoft.com/.default"],
        });
        done(null, result?.accessToken ?? "");
      } catch (err) {
        done(err as Error, "");
      }
    },
  });

  console.log("[outlook] Graph client initialised");
  return true;
}

/** Fetch recent unread emails from the user's mailbox */
export async function fetchRecentEmails(
  sinceMinutes = 60
): Promise<OutlookEmail[]> {
  if (!graphClient) return [];

  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();

  try {
    const response = await graphClient
      .api("/me/mailFolders/inbox/messages")
      .filter(`receivedDateTime ge ${since}`)
      .select("id,subject,bodyPreview,body,from,receivedDateTime,webLink")
      .top(50)
      .orderby("receivedDateTime desc")
      .get();

    return (response.value ?? []) as OutlookEmail[];
  } catch (err) {
    console.error("[outlook] Error fetching emails:", err);
    return [];
  }
}

/** Convert an Outlook email into a plain-text summary for analysis */
export function emailToText(email: OutlookEmail): string {
  const body =
    email.body.contentType === "html"
      ? stripHtml(email.body.content)
      : email.body.content;

  return [
    `From: ${email.from.emailAddress.name} <${email.from.emailAddress.address}>`,
    `Subject: ${email.subject}`,
    `Date: ${email.receivedDateTime}`,
    "",
    body.slice(0, 3000),
  ].join("\n");
}
