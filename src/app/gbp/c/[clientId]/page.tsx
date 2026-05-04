export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft, Building, ExternalLink } from "lucide-react";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { ClientToolHeader } from "@/components/shell/client-tool-grid";
import { GbpRunner } from "./gbp-runner";
import { playbookFor, scoreGbpProfile } from "@/lib/gbp-playbook";

export default async function PerClientGbpPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId: cidStr } = await params;
  const clientId = Number(cidStr);
  if (!Number.isFinite(clientId)) notFound();

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) notFound();

  const allClients = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));

  if (!client.gbpUrl) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/gbp"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          All clients
        </Link>
        <PageHeader
          title={`GBP · ${client.name}`}
          description="Add the Google Maps share link in client settings to enable scraping."
          icon={Building}
          accent="cyan"
        />
        <div className="glass-apple relative overflow-hidden rounded-2xl px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No Google Business Profile URL on this client yet.
          </p>
          <Link
            href={`/clients/${client.id}/edit`}
            className="mt-3 inline-flex items-center gap-1 text-sm text-violet-300 hover:underline"
          >
            Add it on the edit page
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ClientToolHeader
        current={{
          id: client.id,
          name: client.name,
          url: client.url,
          logoUrl: client.logoUrl,
        }}
        allClients={allClients}
        basePath="/gbp/c"
        toolLabel="GBP"
        icon={Building}
      />

      <PageHeader
        title={`GBP · ${client.name}`}
        description="Pull the public Google Business Profile, see recent reviews, draft AI replies you can paste into GBP."
        icon={Building}
        accent="cyan"
      />

      <GbpRunner clientId={client.id} clientName={client.name} />

      <GbpPlaybookSection
        niche={client.niche}
        gbpScore={
          scoreGbpProfile({
            hasGbpUrl: Boolean(client.gbpUrl),
            hasAddress: Boolean(client.address),
            hasPhone: Boolean(client.phone),
            hasHours: false,
            reviewCount: null,
            ratingAverage: null,
          }).score
        }
      />
    </div>
  );
}

function GbpPlaybookSection({
  niche,
  gbpScore,
}: {
  niche: "local" | "ecommerce" | "saas" | "blog" | "services" | null;
  gbpScore: number;
}) {
  const items = playbookFor(niche);
  const cadenceTone: Record<string, string> = {
    once: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
    weekly: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    monthly: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
    quarterly: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  };
  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">
            GBP optimization playbook ({items.length} items)
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Profile-completeness signal score: {gbpScore}/100. Items below
            are sorted by impact, marked by cadence so you know what to do
            once vs every week.
          </p>
        </div>
      </header>
      <ul className="divide-y divide-white/[0.05]">
        {items.map((p) => (
          <li key={p.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ring-inset ${cadenceTone[p.cadence]}`}
                  >
                    {p.cadence}
                  </span>
                  <span className="text-amber-300 text-[10px]">
                    {"★".repeat(p.weight)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.whyItMatters}
                </p>
                <p className="mt-1.5 text-xs">
                  <span className="font-medium text-foreground">Action:</span>{" "}
                  <span className="text-muted-foreground">{p.action}</span>
                </p>
              </div>
              {p.toolPath && (
                <a
                  href={p.toolPath}
                  className="rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-foreground"
                >
                  Open tool →
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
