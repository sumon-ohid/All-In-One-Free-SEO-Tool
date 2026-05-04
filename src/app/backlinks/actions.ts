"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { backlinks } from "@/db/schema";
import { logActivity } from "@/lib/activity";

const backlinkInput = z.object({
  clientId: z.coerce.number().int().positive(),
  sourceUrl: z
    .string()
    .trim()
    .min(1)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url()),
  targetUrl: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  anchorText: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  domainAuthority: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.nan().transform(() => undefined)),
  notes: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export type AddBacklinkResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

export async function addBacklink(
  _prev: AddBacklinkResult | null,
  formData: FormData,
): Promise<AddBacklinkResult> {
  const raw = {
    clientId: formData.get("clientId"),
    sourceUrl: formData.get("sourceUrl"),
    targetUrl: formData.get("targetUrl") ?? undefined,
    anchorText: formData.get("anchorText") ?? undefined,
    domainAuthority: formData.get("domainAuthority") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  };
  const parsed = backlinkInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const sourceDomain = new URL(parsed.data.sourceUrl).hostname.replace(
    /^www\./i,
    "",
  );

  const [row] = await db
    .insert(backlinks)
    .values({
      clientId: parsed.data.clientId,
      sourceUrl: parsed.data.sourceUrl,
      sourceDomain,
      targetUrl: parsed.data.targetUrl,
      anchorText: parsed.data.anchorText,
      domainAuthority: parsed.data.domainAuthority,
      notes: parsed.data.notes,
    })
    .returning({ id: backlinks.id });

  revalidatePath("/backlinks");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { ok: true, id: row.id };
}

export async function setBacklinkStatus(
  backlinkId: number,
  status: "active" | "lost" | "disavow",
) {
  await db
    .update(backlinks)
    .set({ status, updatedAt: new Date() })
    .where(eq(backlinks.id, backlinkId));
  revalidatePath("/backlinks");
}

export async function deleteBacklink(backlinkId: number) {
  await db.delete(backlinks).where(eq(backlinks.id, backlinkId));
  revalidatePath("/backlinks");
}

// =============== Manual link log ===============

const linkLogInput = z.object({
  clientId: z.coerce.number().int().positive(),
  sourceUrl: z
    .string()
    .trim()
    .min(1)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url()),
  targetUrl: z
    .string()
    .trim()
    .min(1)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url())
    .optional()
    .or(z.literal("").transform(() => undefined)),
  anchorText: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  method: z
    .enum([
      "guest_post",
      "outreach",
      "citation",
      "broken_link",
      "resource_page",
      "directory",
      "social_profile",
      "podcast",
      "interview",
      "other",
    ])
    .default("other"),
  rel: z
    .enum(["dofollow", "nofollow", "ugc", "sponsored"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  domainAuthority: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.nan().transform(() => undefined)),
  placedAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export type LogLinkResult = { ok: true; id: number } | { ok: false; error: string };

/**
 * Log an outbound link the SEO actually built. Goes into the same backlinks
 * table as discovered links but with source="manual" so reports can split
 * "links built this period" from "links observed this period."
 */
export async function logBuiltLink(
  _prev: LogLinkResult | null,
  formData: FormData,
): Promise<LogLinkResult> {
  const raw = {
    clientId: formData.get("clientId"),
    sourceUrl: formData.get("sourceUrl"),
    targetUrl: formData.get("targetUrl") ?? undefined,
    anchorText: formData.get("anchorText") ?? undefined,
    method: formData.get("method") || "other",
    rel: formData.get("rel") ?? undefined,
    domainAuthority: formData.get("domainAuthority") ?? undefined,
    placedAt: formData.get("placedAt") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  };
  const parsed = linkLogInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const sourceDomain = new URL(parsed.data.sourceUrl).hostname.replace(
    /^www\./i,
    "",
  );

  const placedDate = parsed.data.placedAt
    ? new Date(parsed.data.placedAt)
    : new Date();

  const [row] = await db
    .insert(backlinks)
    .values({
      clientId: parsed.data.clientId,
      sourceUrl: parsed.data.sourceUrl,
      sourceDomain,
      targetUrl: parsed.data.targetUrl ?? null,
      anchorText: parsed.data.anchorText ?? null,
      domainAuthority: parsed.data.domainAuthority ?? null,
      notes: parsed.data.notes ?? null,
      source: "manual",
      method: parsed.data.method,
      rel: parsed.data.rel ?? null,
      placedAt: placedDate,
      firstSeen: placedDate,
      lastSeen: placedDate,
    })
    .returning({ id: backlinks.id });

  await logActivity({
    kind: "task.completed",
    message: `Logged link from ${sourceDomain} (method: ${parsed.data.method})`,
    level: "success",
    clientId: parsed.data.clientId,
    entityType: "backlink",
    entityId: row.id,
  });

  revalidatePath("/backlinks");
  revalidatePath(`/backlinks/c/${parsed.data.clientId}`);
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { ok: true, id: row.id };
}
