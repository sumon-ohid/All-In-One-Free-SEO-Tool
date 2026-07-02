"use server";

import { auditFreshness, type FreshnessAudit } from "@/lib/freshness-check";
import { saveToolRun } from "@/lib/tool-runs";

export async function runFreshnessAudit(
  url: string,
  sitemapUrl?: string,
): Promise<FreshnessAudit> {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, url: "", error: "Enter a URL first." };
  const result = await auditFreshness(trimmed, {
    sitemapUrl: sitemapUrl?.trim() || undefined,
  });
  await saveToolRun({
    toolId: "freshness",
    label:
      result.ok
        ? `${result.url} · ${result.verdict} · score ${result.score}`
        : `${trimmed} · error`,
    input: { url: trimmed, sitemapUrl: sitemapUrl ?? null },
    result,
  }).catch(() => undefined);
  return result;
}
