export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Brain, Sparkles, Zap } from "lucide-react";
import { db } from "@/db/client";
import { aiFeedback, aiPreferences } from "@/db/schema";
import { count, desc } from "drizzle-orm";
import { PageHeader } from "@/components/shell/page-header";
import {
  deletePreference,
  togglePreference,
} from "./actions";
import { DistillButton } from "./distill-button";

const CONFIDENCE_TONE: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  medium: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  low: "bg-white/5 text-muted-foreground ring-white/10",
};

export default async function AiLearningPage() {
  const [prefs, [{ value: feedbackCount }]] = await Promise.all([
    db
      .select()
      .from(aiPreferences)
      .orderBy(
        // Sort by confidence high → low (string sort works since we set
        // confidence to a fixed enum)
        desc(aiPreferences.confidence),
        desc(aiPreferences.derivedFrom),
      ),
    db.select({ value: count() }).from(aiFeedback),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Back to settings
      </Link>

      <PageHeader
        title="AI learning"
        description="The tool watches what you correct in AI output and turns the corrections into durable style rules. Rules below are added to every prompt automatically — the more you correct, the better the next AI response."
        icon={Brain}
        accent="violet"
      />

      <section className="glass-apple relative overflow-hidden rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">
              {feedbackCount} pieces of feedback collected
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Distill turns recent thumbs-down + correction pairs into
              concise style rules. Re-runs are cheap and idempotent.
            </p>
          </div>
          <DistillButton />
        </div>
      </section>

      <section className="glass-apple relative overflow-hidden rounded-2xl">
        <header className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-violet-300" />
            Learned style rules ({prefs.length})
          </h2>
        </header>
        {prefs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No rules learned yet. As you correct AI output, the tool builds
            up a style-rule library here.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {prefs.map((p) => (
              <li
                key={p.id}
                className={`flex items-start gap-3 px-5 py-4 ${
                  p.active ? "" : "opacity-50"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${CONFIDENCE_TONE[p.confidence]}`}
                >
                  {p.confidence}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm">{p.rule}</p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 ring-1 ring-inset ring-white/10">
                      {p.feature}
                    </span>
                    <span>· derived from {p.derivedFrom} correction{p.derivedFrom === 1 ? "" : "s"}</span>
                    {p.clientId && (
                      <span>· client #{p.clientId} only</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <form action={togglePreference.bind(null, p.id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
                    >
                      {p.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deletePreference.bind(null, p.id)}>
                    <button
                      type="submit"
                      className="rounded-md bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-apple relative overflow-hidden rounded-2xl p-5 text-sm">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="size-4 text-amber-300" />
          How it works
        </h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
          <li>Every AI feature has thumbs-up / thumbs-down + a correction box.</li>
          <li>Thumbs-down with a corrected version is gold — that&apos;s a clear &quot;here&apos;s what you should have written&quot; signal.</li>
          <li>
            On distill, the AI itself analyses recent corrections and proposes
            durable rules (&quot;Always use UK English&quot;, &quot;Never start with &apos;In conclusion&apos;&quot;).
          </li>
          <li>
            Rules with multiple confirmations get promoted from &quot;tentative&quot; → &quot;probable&quot; → &quot;applied&quot;.
          </li>
          <li>
            Active rules get injected into every AI prompt for that feature
            (and workspace-wide rules apply everywhere).
          </li>
        </ol>
      </section>
    </div>
  );
}
