"use server";

import {
  runReputationAbuseScan,
  type RiskReport,
} from "@/lib/reputation-abuse-risk";
import { saveToolRun } from "@/lib/tool-runs";

export type ScanState =
  | { ok: true; report: RiskReport }
  | { ok: false; error: string }
  | null;

export async function scanForRisk(
  _prev: ScanState,
  formData: FormData,
): Promise<ScanState> {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { ok: false, error: "Enter a URL." };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  try {
    const report = await runReputationAbuseScan(parsed.toString(), 30);
    await saveToolRun({
      toolId: "reputation-abuse-risk",
      label: `${report.domain} · overall ${report.overall} · ${report.sections.length} sections`,
      input: { url: parsed.toString() },
      result: { ok: true, report },
    }).catch(() => undefined);
    return { ok: true, report };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Scan failed.",
    };
  }
}
