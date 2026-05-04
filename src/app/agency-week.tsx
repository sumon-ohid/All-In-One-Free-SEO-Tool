import Link from "next/link";
import { gte, eq, count, and, desc } from "drizzle-orm";
import {
  Activity,
  Briefcase,
  Link2,
  ListChecks,
  Megaphone,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { db } from "@/db/client";
import {
  backlinks,
  brandMentions,
  clients,
  shortLinks,
  shortLinkClicks,
  tasks,
  pageChanges,
  monitoredPages,
} from "@/db/schema";

/**
 * Agency-week-in-review tile rendered on the dashboard. Aggregates
 * activity across every client over the last 7 days so an agency
 * owner can read it as a Monday-morning briefing.
 */
export async function AgencyWeekInReview() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [{ value: clientCount }],
    [{ value: tasksDone }],
    [{ value: linksBuilt }],
    [{ value: shortLinkCount }],
    [{ value: clicksRecent }],
    [{ value: mentionsRecent }],
    [{ value: positiveMentions }],
    [{ value: pageChangesRecent }],
  ] = await Promise.all([
    db.select({ value: count() }).from(clients),
    db
      .select({ value: count() })
      .from(tasks)
      .where(and(eq(tasks.status, "done"), gte(tasks.updatedAt, cutoff))),
    db
      .select({ value: count() })
      .from(backlinks)
      .where(
        and(
          eq(backlinks.source, "manual"),
          gte(backlinks.placedAt, cutoff),
        ),
      ),
    db.select({ value: count() }).from(shortLinks),
    db
      .select({ value: count() })
      .from(shortLinkClicks)
      .where(gte(shortLinkClicks.clickedAt, cutoff)),
    db
      .select({ value: count() })
      .from(brandMentions)
      .where(gte(brandMentions.capturedAt, cutoff)),
    db
      .select({ value: count() })
      .from(brandMentions)
      .where(
        and(
          gte(brandMentions.capturedAt, cutoff),
          gte(brandMentions.sentiment, 1),
        ),
      ),
    // Page changes: join through monitoredPages, count those detected in cutoff
    db
      .select({ value: count() })
      .from(pageChanges)
      .leftJoin(
        monitoredPages,
        eq(pageChanges.monitoredPageId, monitoredPages.id),
      )
      .where(gte(pageChanges.detectedAt, cutoff)),
  ]);

  const recentActiveClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      url: clients.url,
    })
    .from(clients)
    .innerJoin(tasks, eq(tasks.clientId, clients.id))
    .where(and(eq(tasks.status, "done"), gte(tasks.updatedAt, cutoff)))
    .groupBy(clients.id)
    .orderBy(desc(clients.updatedAt))
    .limit(5);

  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Briefcase className="size-4 text-violet-300" />
          Agency week in review
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Aggregate activity across all {clientCount} client
          {clientCount === 1 ? "" : "s"} over the last 7 days.
        </p>
      </header>

      <div className="grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
        <Tile
          icon={ListChecks}
          label="Tasks completed"
          value={tasksDone}
          href="/tasks"
          tone="emerald"
        />
        <Tile
          icon={Link2}
          label="Links built"
          value={linksBuilt}
          href="/backlinks"
          tone="cyan"
        />
        <Tile
          icon={MousePointerClick}
          label="Short-link clicks"
          value={clicksRecent}
          href="/links"
          tone="violet"
          subtitle={`${shortLinkCount} active`}
        />
        <Tile
          icon={Megaphone}
          label="Brand mentions"
          value={mentionsRecent}
          href="/brand-monitor"
          tone={positiveMentions > 0 ? "emerald" : "amber"}
          subtitle={
            positiveMentions > 0
              ? `${positiveMentions} positive`
              : "scan to update"
          }
        />
        <Tile
          icon={Activity}
          label="Page changes"
          value={pageChangesRecent}
          href="/monitor"
          tone={pageChangesRecent > 0 ? "amber" : "neutral"}
        />
        <Tile
          icon={TrendingUp}
          label="Active clients"
          value={recentActiveClients.length}
          href="/clients"
          tone="violet"
          subtitle="had completions"
        />
      </div>

      {recentActiveClients.length > 0 && (
        <div className="border-t border-white/[0.06] px-5 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Most active clients
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recentActiveClients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="rounded-md bg-white/5 px-2.5 py-1 text-xs ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  href,
  tone,
  subtitle,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  href: string;
  tone: "neutral" | "violet" | "cyan" | "emerald" | "amber" | "rose";
  subtitle?: string;
}) {
  const toneClass = {
    neutral: "text-foreground",
    violet: "text-violet-300",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  }[tone];
  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition-colors hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <Icon className={`size-3.5 ${toneClass}`} />
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] text-muted-foreground">{subtitle}</div>
      )}
    </Link>
  );
}

// Avoid "unused variable" complaint when not all icons end up rendered
void TrendingDown;
