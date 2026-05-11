/**
 * Test-provider endpoint — runs a tiny real call against the named
 * provider and reports back success + the response text, OR the actual
 * error message from the API. Lets the Settings page show "AI is
 * working" or "Wrong key — error code 401" instead of just sitting on
 * 'Configured' and hoping for the best.
 */

import { callAI } from "@/lib/ai-call";
import type { ActiveProvider } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

const VALID: ReadonlySet<ActiveProvider> = new Set([
  "openai",
  "anthropic",
  "gemini",
  "perplexity",
  "openrouter",
  "groq",
  "mistral",
  "deepseek",
  "cerebras",
  "together",
  "github",
  "ollama",
]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    provider?: string;
  } | null;
  const provider = body?.provider as ActiveProvider | undefined;

  if (!provider || !VALID.has(provider)) {
    return Response.json(
      { ok: false, error: "Invalid provider" },
      { status: 400 },
    );
  }

  const startedAt = Date.now();
  let text: string | null = null;
  let error: string | null = null;

  try {
    text = await callAI({
      providerOverride: provider,
      system:
        "You are a connection-test reply. Respond with exactly one short sentence confirming you received the message.",
      user: "Say: 'Connected.'",
      maxTokens: 30,
      temperature: 0,
      timeoutMs: 20_000,
      feature: "general",
      ignoreCreditSaver: true,
    });
  } catch (err) {
    error = (err as Error).message ?? "Unknown error";
  }

  const elapsedMs = Date.now() - startedAt;

  if (text) {
    return Response.json({
      ok: true,
      provider,
      reply: text.slice(0, 200),
      elapsedMs,
    });
  }

  return Response.json(
    {
      ok: false,
      provider,
      error:
        error ??
        "Provider returned no response. Common causes: invalid key, no key configured, wrong model name, rate-limited, or network/firewall blocking the API host.",
      elapsedMs,
    },
    { status: 200 },
  );
}
