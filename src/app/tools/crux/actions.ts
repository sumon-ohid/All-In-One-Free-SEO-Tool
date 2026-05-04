"use server";

import { z } from "zod";
import { fetchCruxData, type CruxResult, type CruxFormFactor } from "@/lib/crux";

const schema = z.object({
  url: z
    .string()
    .trim()
    .min(3)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url()),
  formFactor: z.enum(["PHONE", "DESKTOP", "ALL_FORM_FACTORS"]).default("PHONE"),
});

export type CruxState = (CruxResult & { url: string }) | { error: string } | null;

export async function runCrux(
  _prev: CruxState,
  formData: FormData,
): Promise<CruxState> {
  const parsed = schema.safeParse({
    url: formData.get("url"),
    formFactor: formData.get("formFactor") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const result = await fetchCruxData({
    url: parsed.data.url,
    formFactor: parsed.data.formFactor as CruxFormFactor,
  });
  return { ...result, url: parsed.data.url };
}
