/** A monitored source (RSS feed, gov.uk page, etc.) */
export interface Source {
  id?: number;
  name: string;
  type: "rss" | "outlook" | "webpage";
  url: string;
  enabled: boolean;
  last_checked_at: string | null;
  created_at?: string;
}

/** A raw development picked up from monitoring */
export interface Development {
  id?: number;
  source_id: number;
  source_name?: string;
  title: string;
  summary: string;
  url: string | null;
  raw_content: string;
  detected_at: string;
  status: "new" | "flagged" | "dismissed";
}

/** A generated flag / tactical note */
export interface Flag {
  id?: number;
  development_id: number;
  title: string;
  content: string;
  client_tags: string; // comma-separated
  status: "draft" | "reviewed" | "sent";
  created_at?: string;
  updated_at?: string;
}

/** A style example provided by the user */
export interface StyleExample {
  id?: number;
  title: string;
  content: string;
  notes: string | null;
  created_at?: string;
}

/** A client / topic to monitor for */
export interface ClientTopic {
  id?: number;
  name: string;
  keywords: string; // comma-separated
  description: string;
  enabled: boolean;
}

/** Outlook email as returned from Graph API */
export interface OutlookEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  body: { contentType: string; content: string };
  from: { emailAddress: { name: string; address: string } };
  receivedDateTime: string;
  webLink: string;
}

/** Config loaded from env */
export interface AppConfig {
  anthropicApiKey: string;
  azureClientId: string;
  azureClientSecret: string;
  azureTenantId: string;
  port: number;
  monitorIntervalMinutes: number;
}
