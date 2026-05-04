import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, contentBriefs } from "@/db/schema";
import { csvResponse } from "@/lib/csv-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: contentBriefs.id,
      title: contentBriefs.title,
      targetKeyword: contentBriefs.targetKeyword,
      status: contentBriefs.status,
      targetWordCount: contentBriefs.targetWordCount,
      publishedUrl: contentBriefs.publishedUrl,
      createdAt: contentBriefs.createdAt,
      updatedAt: contentBriefs.updatedAt,
      clientName: clients.name,
      clientUrl: clients.url,
    })
    .from(contentBriefs)
    .leftJoin(clients, eq(contentBriefs.clientId, clients.id))
    .orderBy(desc(contentBriefs.createdAt));

  return csvResponse(
    "content-briefs.csv",
    [
      "id",
      "client",
      "client_url",
      "title",
      "target_keyword",
      "status",
      "target_word_count",
      "published_url",
      "created_at",
      "updated_at",
    ],
    rows.map((r) => [
      r.id,
      r.clientName,
      r.clientUrl,
      r.title,
      r.targetKeyword,
      r.status,
      r.targetWordCount,
      r.publishedUrl,
      r.createdAt,
      r.updatedAt,
    ]),
  );
}
