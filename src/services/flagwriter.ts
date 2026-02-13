import Anthropic from "@anthropic-ai/sdk";
import type Database from "better-sqlite3";
import type { Development, ClientTopic, StyleExample } from "../types/index.js";
import {
  getStyleExamples,
  getEnabledClientTopics,
  createFlag,
  updateDevelopmentStatus,
} from "../db/repository.js";

let client: Anthropic | null = null;

export function initAnthropicClient(apiKey: string): void {
  client = new Anthropic({ apiKey });
  console.log("[flagwriter] Anthropic client initialised");
}

/** Build the system prompt incorporating style examples and client topics */
function buildSystemPrompt(
  styleExamples: StyleExample[],
  clientTopics: ClientTopic[]
): string {
  let prompt = `You are an expert UK public affairs analyst. Your job is to take raw developments — from parliamentary activity, government publications, news, and emails — and write concise, actionable tactical flags for clients.

Your flags should be:
- Written in a professional, authoritative but accessible tone
- Concise (typically 2-4 paragraphs)
- Structured with a clear headline, the key development, why it matters, and recommended next steps or implications
- Focused on tactical value — what does the client need to know and do?
- Written for a UK audience familiar with Westminster, Whitehall, and the regulatory landscape

Format each flag as:
**[HEADLINE IN CAPS]**

[Opening line stating the development clearly]

[1-2 paragraphs on significance, context, and tactical implications]

**Next steps / What to watch:** [Brief actionable guidance]

---
`;

  if (styleExamples.length > 0) {
    prompt += `\n\nHere are examples of the user's own flag-writing style. Match this tone, structure, and level of detail as closely as possible:\n`;
    for (const ex of styleExamples) {
      prompt += `\n--- Example: "${ex.title}" ---\n${ex.content}\n--- End ---\n`;
    }
  }

  if (clientTopics.length > 0) {
    prompt += `\n\nActive client topics to consider relevance for:\n`;
    for (const topic of clientTopics) {
      prompt += `- ${topic.name}: ${topic.description} (keywords: ${topic.keywords})\n`;
    }
  }

  return prompt;
}

/** Assess whether a development is relevant to any client topics */
export async function assessRelevance(
  development: Development,
  clientTopics: ClientTopic[]
): Promise<{ relevant: boolean; matchedTopics: string[] }> {
  if (!client) throw new Error("Anthropic client not initialised");
  if (clientTopics.length === 0) return { relevant: true, matchedTopics: [] };

  const topicList = clientTopics
    .map((t) => `- ${t.name}: ${t.description} (keywords: ${t.keywords})`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Given this development:\n\nTitle: ${development.title}\nSummary: ${development.summary}\n\nAnd these client topics:\n${topicList}\n\nWhich topics (if any) is this development relevant to? Reply with a JSON object: {"relevant": true/false, "topics": ["topic name", ...]}. Only include topics where there is a genuine connection.`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        relevant: parsed.relevant ?? false,
        matchedTopics: parsed.topics ?? [],
      };
    }
  } catch {
    // If parsing fails, default to relevant
  }

  return { relevant: true, matchedTopics: [] };
}

/** Generate a flag for a given development */
export async function generateFlag(
  db: Database.Database,
  development: Development,
  clientTags?: string[]
): Promise<{ title: string; content: string } | null> {
  if (!client) throw new Error("Anthropic client not initialised");

  const styleExamples = getStyleExamples(db);
  const clientTopics = getEnabledClientTopics(db);
  const systemPrompt = buildSystemPrompt(styleExamples, clientTopics);

  const userMessage = `Write a tactical flag based on this development:

Title: ${development.title}
Source: ${development.source_name ?? "Unknown"}
Summary: ${development.summary}

Full content:
${development.raw_content.slice(0, 4000)}

${clientTags && clientTags.length > 0 ? `This is relevant to these clients/topics: ${clientTags.join(", ")}` : "Determine the most relevant client topics."}

Write the flag now.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract headline from the flag
    const headlineMatch = text.match(/\*\*\[(.+?)\]\*\*/);
    const title = headlineMatch ? headlineMatch[1] : development.title;

    return { title, content: text };
  } catch (err) {
    console.error("[flagwriter] Error generating flag:", err);
    return null;
  }
}

/** Generate and save a flag for a development */
export async function generateAndSaveFlag(
  db: Database.Database,
  development: Development
): Promise<void> {
  const clientTopics = getEnabledClientTopics(db);

  // Assess relevance first
  const { relevant, matchedTopics } = await assessRelevance(
    development,
    clientTopics
  );

  if (!relevant && clientTopics.length > 0) {
    updateDevelopmentStatus(db, development.id!, "dismissed");
    return;
  }

  const result = await generateFlag(db, development, matchedTopics);
  if (!result) return;

  createFlag(db, {
    development_id: development.id!,
    title: result.title,
    content: result.content,
    client_tags: matchedTopics.join(", "),
    status: "draft",
  });

  updateDevelopmentStatus(db, development.id!, "flagged");
}
