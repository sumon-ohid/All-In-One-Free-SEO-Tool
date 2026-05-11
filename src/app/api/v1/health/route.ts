import { jsonOk } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk({
    ok: true,
    service: "seo-tool",
    version: "v1",
    time: new Date().toISOString(),
  });
}
