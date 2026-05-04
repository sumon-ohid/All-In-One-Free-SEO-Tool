"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { botLogUploads, clients } from "@/db/schema";

/**
 * Bot user-agent patterns we care about, in priority order. The first regex
 * that matches a UA wins — keeps generic matches like /bot/ from polluting.
 */
const BOT_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "GPTBot", re: /GPTBot/i },
  { name: "ChatGPT-User", re: /ChatGPT-User/i },
  { name: "OAI-SearchBot", re: /OAI-SearchBot/i },
  { name: "ClaudeBot", re: /ClaudeBot/i },
  { name: "Claude-Web", re: /Claude-Web/i },
  { name: "PerplexityBot", re: /PerplexityBot/i },
  { name: "Perplexity-User", re: /Perplexity-User/i },
  { name: "Google-Extended", re: /Google-Extended/i },
  { name: "Bytespider", re: /Bytespider/i },
  { name: "CCBot", re: /CCBot/i },
  { name: "Amazonbot", re: /Amazonbot/i },
  { name: "anthropic-ai", re: /anthropic-ai/i },
  { name: "cohere-ai", re: /cohere-ai/i },
  { name: "FacebookBot", re: /FacebookBot/i },
  { name: "Applebot-Extended", re: /Applebot-Extended/i },
  // Established crawlers (helpful baseline to compare AI bots against)
  { name: "Googlebot", re: /Googlebot/i },
  { name: "Bingbot", re: /bingbot/i },
  { name: "DuckDuckBot", re: /DuckDuckBot/i },
  { name: "YandexBot", re: /YandexBot/i },
];

/**
 * Best-effort UA extraction from a single Nginx/Apache combined-log line.
 * Combined log format: ip - - [date] "GET /path HTTP/1.1" 200 size "ref" "ua"
 * We grab the LAST quoted field — that's the UA in every common format.
 */
function extractUa(line: string): string | null {
  const matches = line.match(/"([^"]*)"/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1];
  return last.slice(1, -1).trim() || null;
}

function classify(ua: string): string | null {
  for (const { name, re } of BOT_PATTERNS) {
    if (re.test(ua)) return name;
  }
  return null;
}

export type ParseResult = {
  ok: true;
  uploadId: number;
  totalLines: number;
  matchedLines: number;
  botCounts: Record<string, number>;
} | {
  ok: false;
  error: string;
};

export async function parseAndStoreLog(input: {
  text: string;
  sourceName?: string;
  clientId?: number | null;
}): Promise<ParseResult> {
  if (!input.text || input.text.length === 0) {
    return { ok: false, error: "Empty file" };
  }
  const lines = input.text.split(/\r?\n/);
  const counts = new Map<string, number>();
  let matched = 0;
  for (const line of lines) {
    if (!line) continue;
    const ua = extractUa(line);
    if (!ua) continue;
    const bot = classify(ua);
    if (!bot) continue;
    counts.set(bot, (counts.get(bot) ?? 0) + 1);
    matched++;
  }

  const botCounts: Record<string, number> = Object.fromEntries(counts);

  const [row] = await db
    .insert(botLogUploads)
    .values({
      clientId: input.clientId ?? null,
      sourceName: input.sourceName ?? null,
      rawByteSize: input.text.length,
      lineCount: lines.length,
      botCounts,
    })
    .returning({ id: botLogUploads.id });

  revalidatePath("/bot-logs");

  return {
    ok: true,
    uploadId: row.id,
    totalLines: lines.length,
    matchedLines: matched,
    botCounts,
  };
}

export async function listUploads(opts?: { limit?: number }) {
  return db
    .select({
      id: botLogUploads.id,
      sourceName: botLogUploads.sourceName,
      rawByteSize: botLogUploads.rawByteSize,
      lineCount: botLogUploads.lineCount,
      botCounts: botLogUploads.botCounts,
      uploadedAt: botLogUploads.uploadedAt,
      clientId: botLogUploads.clientId,
      clientName: clients.name,
    })
    .from(botLogUploads)
    .leftJoin(clients, eq(botLogUploads.clientId, clients.id))
    .orderBy(desc(botLogUploads.uploadedAt))
    .limit(opts?.limit ?? 50);
}

export async function deleteUpload(id: number): Promise<void> {
  if (!Number.isFinite(id) || id <= 0) return;
  await db.delete(botLogUploads).where(eq(botLogUploads.id, id));
  revalidatePath("/bot-logs");
}
