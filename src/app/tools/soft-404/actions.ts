"use server";

import { z } from "zod";
import { findSoft404s, type Soft404Result } from "@/lib/soft-404-catcher";

const schema = z.object({
  startUrl: z
    .string()
    .trim()
    .min(3)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url()),
  maxPages: z.coerce.number().int().min(20).max(300).default(100),
});

export type SoftState =
  | { ok: true; result: Soft404Result }
  | { ok: false; error: string };

export async function runSoft404(
  _prev: SoftState | null,
  formData: FormData,
): Promise<SoftState> {
  const parsed = schema.safeParse({
    startUrl: formData.get("startUrl"),
    maxPages: formData.get("maxPages") || 100,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const r = await findSoft404s(parsed.data);
  if (!r.ok && r.error) return { ok: false, error: r.error };
  return { ok: true, result: r };
}
