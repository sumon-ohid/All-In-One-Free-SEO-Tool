/**
 * Generates a real LLM-backed executive summary when an API key is set.
 * Falls back to template-based output otherwise.
 *
 * Uses the central `callAI` helper so it benefits from credit-saver mode
 * + the feedback-driven style learning automatically.
 */

import { callAI } from "./ai-call";

export type ExecSummaryInput = {
  clientId?: number;
  clientName: string;
  clientUrl: string;
  score: number | null;
  prevScore: number | null;
  totalTasks: number;
  doneTasks: number;
  openTasks: number;
  topIssues: { type: string; severity: string; message: string }[];
  techStack: string[] | null;
  niche: string | null;
  /** Real GSC + GA4 numbers when the client has Google linked */
  organicSessions?: number | null;
  organicSessionsDeltaPct?: number | null;
  topQueries?: { query: string; clicks: number; position: number }[];
  quickWinsCount?: number;
};

const SYSTEM_PROMPT = `You write SEO executive summaries for monthly reports.

Strict rules:
- Use the formula: [Direction] + [Win] + [Priority]. Three concise sentences max.
- First sentence: the direction (improved / dropped / held / first measurement) with the score and delta if any.
- Second sentence: the biggest win or notable item this period (work completed, areas improved).
- Third sentence: next priority — what to focus on next, grounded in the data given.
- No marketing fluff. No "we are excited to". Direct, factual, professional.
- Plain language. Use "you/your" where natural.
- Total length: 50-90 words.`;

export async function generateExecSummary(
  input: ExecSummaryInput,
): Promise<string> {
  const userPrompt = buildUserPrompt(input);

  const result = await callAI({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 500,
    temperature: 0.4,
    timeoutMs: 25_000,
    feature: "exec_summary",
    clientId: input.clientId ?? null,
    ignoreCreditSaver: true,
  });

  if (result && result.trim().length > 0) return result.trim();
  return templateSummary(input);
}

function buildUserPrompt(input: ExecSummaryInput): string {
  const lines: string[] = [];
  lines.push(`Client: ${input.clientName} (${input.clientUrl})`);
  if (input.niche) lines.push(`Niche: ${input.niche}`);
  if (input.techStack?.length)
    lines.push(`Tech stack: ${input.techStack.join(", ")}`);

  if (input.score !== null && input.prevScore !== null) {
    const delta = input.score - input.prevScore;
    lines.push(
      `Health score: ${input.score}/100 (${delta > 0 ? "+" : ""}${delta} vs last audit, was ${input.prevScore})`,
    );
  } else if (input.score !== null) {
    lines.push(`Health score: ${input.score}/100 (first measurement)`);
  } else {
    lines.push("Health score: not yet measured");
  }

  lines.push(
    `Tasks: ${input.doneTasks} done / ${input.openTasks} open / ${input.totalTasks} total`,
  );

  if (input.topIssues.length > 0) {
    lines.push("Top issues to address:");
    for (const i of input.topIssues.slice(0, 5)) {
      lines.push(`- [${i.severity}] ${i.type}: ${i.message}`);
    }
  } else {
    lines.push("Top issues: none significant.");
  }

  if (typeof input.organicSessions === "number") {
    const trend =
      typeof input.organicSessionsDeltaPct === "number"
        ? ` (${input.organicSessionsDeltaPct > 0 ? "+" : ""}${input.organicSessionsDeltaPct}% vs prior period)`
        : "";
    lines.push(
      `Organic sessions (last 28 days): ${input.organicSessions.toLocaleString()}${trend}`,
    );
  }
  if (input.topQueries?.length) {
    lines.push("Top organic queries:");
    for (const q of input.topQueries.slice(0, 5)) {
      lines.push(
        `- "${q.query}" — ${q.clicks} clicks at position ${q.position.toFixed(1)}`,
      );
    }
  }
  if (typeof input.quickWinsCount === "number" && input.quickWinsCount > 0) {
    lines.push(
      `Quick-win keywords (positions 4-15 with traffic): ${input.quickWinsCount}`,
    );
  }

  lines.push("");
  lines.push("Write the executive summary now.");
  return lines.join("\n");
}

/**
 * Template-based fallback when no API key is configured.
 * Same formula CLAUDE.md spec'd: [Direction] + [Win] + [Priority].
 */
function templateSummary(input: ExecSummaryInput): string {
  const parts: string[] = [];

  if (input.score !== null && input.prevScore !== null) {
    const delta = input.score - input.prevScore;
    if (Math.abs(delta) < 2) {
      parts.push(
        `${input.clientName}'s health score held steady at ${input.score}/100 this period.`,
      );
    } else if (delta > 0) {
      parts.push(
        `${input.clientName}'s health score improved by ${delta} points this period to ${input.score}/100.`,
      );
    } else {
      parts.push(
        `${input.clientName}'s health score dropped ${Math.abs(delta)} points this period to ${input.score}/100.`,
      );
    }
  } else if (input.score !== null) {
    parts.push(
      `${input.clientName} now has a baseline health score of ${input.score}/100 — first measurement.`,
    );
  } else {
    parts.push(`${input.clientName} has no completed audit yet.`);
  }

  if (input.doneTasks > 0) {
    parts.push(
      `We closed ${input.doneTasks} of ${input.totalTasks} open SEO tasks.`,
    );
  } else if (input.totalTasks > 0) {
    parts.push(
      `${input.totalTasks} SEO tasks are queued — no completions logged yet.`,
    );
  }

  const top = input.topIssues[0];
  if (top) {
    parts.push(`Next focus: ${top.message.toLowerCase()}`);
  }

  return parts.join(" ");
}
