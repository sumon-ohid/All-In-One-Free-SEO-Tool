/**
 * Bing Webmaster Tools API — free, requires only an API key the user
 * generates in https://www.bing.com/webmasters → Settings → API access.
 *
 * Docs: https://learn.microsoft.com/en-us/bingwebmaster/
 *
 * We use the JSON endpoints (svc=json). Keys live in our settings store
 * under `bing.api_key` so users add it once at the workspace level.
 */

import { getSetting } from "./settings-store";

const BASE = "https://ssl.bing.com/webmaster/api.svc/json";

export async function getBingApiKey(): Promise<string | null> {
  return (await getSetting<string>("bing.api_key")) ?? null;
}

async function bingFetch<T>(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  const key = await getBingApiKey();
  if (!key) throw new Error("Bing API key not configured");
  const qs = new URLSearchParams({ apikey: key });
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const res = await fetch(`${BASE}/${endpoint}?${qs.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bing ${endpoint} failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export type BingSite = {
  Url: string;
  IsVerified: boolean;
};

export async function listBingSites(): Promise<BingSite[]> {
  type R = { d: BingSite[] | null };
  const data = await bingFetch<R>("GetUserSites", {});
  return data.d ?? [];
}

export type BingQueryStat = {
  Query: string;
  /** Avg position over the period (1-based, lower is better). */
  AvgImpressionPosition: number;
  /** Avg click-through position. */
  AvgClickPosition: number;
  Clicks: number;
  Impressions: number;
};

/**
 * Top queries the user's site received from Bing search over the last
 * 6 months (Bing's default window). Used in dashboards alongside GSC.
 */
export async function getBingTopQueries(opts: {
  siteUrl: string;
}): Promise<BingQueryStat[]> {
  type R = { d: BingQueryStat[] | null };
  const data = await bingFetch<R>("GetQueryStats", {
    siteUrl: opts.siteUrl,
  });
  return data.d ?? [];
}

export type BingPageStat = {
  Page: string;
  Clicks: number;
  Impressions: number;
  AvgImpressionPosition: number;
};

export async function getBingTopPages(opts: {
  siteUrl: string;
}): Promise<BingPageStat[]> {
  type R = { d: BingPageStat[] | null };
  const data = await bingFetch<R>("GetPageStats", {
    siteUrl: opts.siteUrl,
  });
  return data.d ?? [];
}

export type BingCrawlIssue = {
  Url: string;
  HttpCode: number;
  IssueType: number;
  IssueLevel: number;
  CrawledDate: string;
};

export async function getBingCrawlIssues(opts: {
  siteUrl: string;
}): Promise<BingCrawlIssue[]> {
  type R = { d: BingCrawlIssue[] | null };
  const data = await bingFetch<R>("GetCrawlIssues", {
    siteUrl: opts.siteUrl,
  });
  return data.d ?? [];
}

/**
 * Submit URLs to Bing for indexing. Bing has a daily quota per site (the
 * UI shows your remaining quota). Returns d=null on success.
 */
export async function bingSubmitUrlBatch(opts: {
  siteUrl: string;
  urlList: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const key = await getBingApiKey();
  if (!key) return { ok: false, error: "Bing API key not configured" };
  const url = `${BASE}/SubmitUrlbatch?apikey=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        accept: "application/json",
      },
      body: JSON.stringify({
        siteUrl: opts.siteUrl,
        urlList: opts.urlList,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status} ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export type BingQuota = {
  DailyQuota: number;
  MonthlyQuota: number;
};

export async function getBingUrlSubmissionQuota(opts: {
  siteUrl: string;
}): Promise<BingQuota | null> {
  try {
    type R = { d: BingQuota | null };
    const data = await bingFetch<R>("GetUrlSubmissionQuota", {
      siteUrl: opts.siteUrl,
    });
    return data.d ?? null;
  } catch {
    return null;
  }
}
