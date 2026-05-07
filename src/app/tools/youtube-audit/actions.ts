"use server";

import { auditYouTube, type YouTubeAuditResult } from "@/lib/youtube-audit";

export type YtAuditState =
  | { ok: true; result: YouTubeAuditResult }
  | { ok: false; error: string };

export async function runYtAudit(
  _prev: YtAuditState | null,
  formData: FormData,
): Promise<YtAuditState> {
  const url = String(formData.get("url") ?? "").trim();
  const targetKeyword =
    String(formData.get("targetKeyword") ?? "").trim() || undefined;
  if (!url) return { ok: false, error: "Paste a YouTube URL." };
  const r = await auditYouTube({ url, targetKeyword });
  if (!r.ok && r.error) return { ok: false, error: r.error };
  return { ok: true, result: r };
}
