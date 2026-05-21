import { jsonOk } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Health probe — also doubles as the cross-install identity beacon.
 *
 * The launcher (START.cmd / START.sh) and any companion tool (tray,
 * future updater) can compare `installRoot` in the response to its own
 * cwd. If they differ, we know SOMEONE ELSE's SEO Tool install is
 * already running on this port and the launcher can either:
 *   - open that one's URL (cooperate)
 *   - pick a different port (avoid collision)
 *
 * `installRoot` is the absolute path on the server. The user's own
 * launcher knows its install path, so the comparison is local-only
 * — no leak risk.
 */
export async function GET() {
  return jsonOk({
    ok: true,
    service: "seo-tool",
    version: "v1",
    time: new Date().toISOString(),
    installRoot: process.cwd(),
    pid: process.pid,
  });
}
