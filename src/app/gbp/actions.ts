"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { scrapeGbp, type GbpReport } from "@/lib/gbp-scraper";
import { callAI } from "@/lib/ai-call";
import {
  GbpScopeMissingError,
  fetchGbpLocationSummary,
  listGbpAccounts,
  listGbpLocations,
  listGbpReviews,
  replyToGbpReview,
  type GbpLocation,
  type GbpReview,
} from "@/lib/gbp-api";

export type RunGbpResult =
  | { ok: true; report: GbpReport }
  | { ok: false; error: string };

export async function runGbpScrape(
  clientId: number,
): Promise<RunGbpResult> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return { ok: false, error: "Client not found" };
  if (!client.gbpUrl) {
    return {
      ok: false,
      error:
        "No Google Business Profile URL on this client. Add it in Edit → GBP profile.",
    };
  }

  const report = await scrapeGbp(client.gbpUrl);
  if (!report.ok) {
    return { ok: false, error: report.error ?? "Scrape failed" };
  }
  return { ok: true, report };
}

const REPLY_SYSTEM = `You write replies to Google Business Profile reviews.

Rules:
- Personal but professional tone
- Acknowledge specific points the reviewer made
- Thank them by name (use first name)
- ≤80 words
- For 4-5 star: warm thanks, invite back
- For 1-3 star: empathy, brief explanation if appropriate, offer to make it right offline
- Do not be defensive or argumentative
- Do not include promotional language
- Do not promise things outside your control

Output ONLY the reply text. No preamble.`;

export type GenerateReplyResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export async function generateReviewReply(opts: {
  businessName: string;
  reviewer: string;
  reviewRating: number | null;
  reviewText: string;
}): Promise<GenerateReplyResult> {
  if (!opts.reviewText.trim()) {
    return { ok: false, error: "Review text is empty" };
  }

  const userPrompt = [
    `Business: ${opts.businessName}`,
    `Reviewer: ${opts.reviewer}`,
    `Rating: ${opts.reviewRating ?? "unknown"}/5`,
    `Review: "${opts.reviewText}"`,
    "",
    "Write the reply now. Reply text only, no quotation marks, no preamble.",
  ].join("\n");

  const raw = await callAI({
    system: REPLY_SYSTEM,
    user: userPrompt,
    maxTokens: 400,
    temperature: 0.5,
    timeoutMs: 30_000,
    feature: "review_reply",
  });

  if (!raw) {
    return {
      ok: false,
      error: "AI provider didn't respond. Set up a key in Settings.",
    };
  }
  return { ok: true, reply: raw.trim().replace(/^["']|["']$/g, "") };
}

// =============== Official GBP API path ===============

export type GbpApiState =
  | {
      ok: true;
      accounts: { name: string; accountName: string; type: string }[];
      locations: GbpLocation[];
      reviews: GbpReview[];
      selectedLocation: string | null;
    }
  | { ok: false; error: string; scopeMissing?: boolean };

export async function loadGbpForClient(
  clientId: number,
  selectedLocation?: string,
): Promise<GbpApiState> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return { ok: false, error: "Client not found" };

  try {
    const accounts = await listGbpAccounts({ clientIdScope: clientId });
    if (accounts.length === 0) {
      return {
        ok: true,
        accounts: [],
        locations: [],
        reviews: [],
        selectedLocation: null,
      };
    }
    // Use first account by default (most users have only one)
    const acct = accounts[0];
    const locations = await listGbpLocations({
      accountName: acct.name,
      clientIdScope: clientId,
    });
    const locName = selectedLocation ?? locations[0]?.name ?? null;
    let reviews: GbpReview[] = [];
    if (locName) {
      try {
        reviews = await listGbpReviews({
          locationName: locName,
          clientIdScope: clientId,
        });
      } catch {
        reviews = [];
      }
    }
    return {
      ok: true,
      accounts,
      locations,
      reviews,
      selectedLocation: locName,
    };
  } catch (err) {
    if (err instanceof GbpScopeMissingError) {
      return {
        ok: false,
        error: err.message,
        scopeMissing: true,
      };
    }
    return { ok: false, error: (err as Error).message };
  }
}

export async function postGbpReply(opts: {
  clientId: number;
  reviewName: string;
  comment: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!opts.comment.trim()) return { ok: false, error: "Reply is empty" };
  return await replyToGbpReview({
    reviewName: opts.reviewName,
    comment: opts.comment.trim(),
    clientIdScope: opts.clientId,
  });
}

/** Used by health checks: confirm the location is reachable via the API. */
export async function pingGbpLocation(opts: {
  clientId: number;
  locationName: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const loc = await fetchGbpLocationSummary({
      locationName: opts.locationName,
      clientIdScope: opts.clientId,
    });
    return { ok: !!loc };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
