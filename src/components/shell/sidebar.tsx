"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  ClipboardList,
  Search,
  FileText,
  Network,
  Sparkles,
  Settings,
  GraduationCap,
  Link2,
  Activity,
  Send,
  History,
  Workflow,
  Receipt,
  ScanText,
  PanelLeftClose,
  PanelLeftOpen,
  Wand2,
  Bot,
  FileDown,
  Gauge,
  GitCompare,
  MapPin,
  Wrench,
  Building,
  Image as ImageIcon,
  Layers,
  Newspaper,
  TrendingDown,
  Flame,
  GitMerge,
  Magnet,
  Video,
  Globe,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  title: string;
  /** Pinned groups are always visible and not collapsible. */
  pinned?: boolean;
  /** Default-expanded if true; otherwise collapsed by default. */
  defaultOpen?: boolean;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    id: "essentials",
    title: "Essentials",
    pinned: true,
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/seo-chat", label: "SEO chat", icon: Bot },
      { href: "/audits", label: "Audits", icon: ClipboardList },
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/tools", label: "All tools", icon: Wrench },
      { href: "/reports", label: "Reports", icon: FileDown },
    ],
  },
  {
    id: "everyday",
    title: "Everyday",
    defaultOpen: false,
    items: [
      { href: "/morning", label: "Morning briefing", icon: Activity },
      { href: "/digest", label: "Weekly digest", icon: Send },
      { href: "/grader", label: "Instant audit", icon: Sparkles },
      { href: "/agent", label: "AI agent", icon: Bot },
      { href: "/ask", label: "Ask the tool", icon: Bot },
      { href: "/capacity", label: "Capacity", icon: Gauge },
      { href: "/activity", label: "Activity log", icon: History },
    ],
  },
  {
    id: "content",
    title: "Content",
    items: [
      { href: "/content", label: "Content overview", icon: FileText },
      { href: "/content/calendar", label: "Content calendar", icon: FileText },
      { href: "/blog", label: "AI blog writer", icon: Wand2 },
      { href: "/content-decay", label: "Content decay", icon: TrendingDown },
      { href: "/content-gap", label: "Content gap", icon: GitCompare },
      { href: "/topic-clusters", label: "Topic clusters", icon: Layers },
      { href: "/title-tests", label: "Title A/B tests", icon: Wand2 },
      { href: "/meta-rewrite", label: "Meta rewrite batch", icon: Wand2 },
    ],
  },
  {
    id: "keywords",
    title: "Keywords & ranks",
    items: [
      { href: "/keywords", label: "Tracked keywords", icon: Search },
      { href: "/cannibalization", label: "Cannibalization", icon: GitMerge },
      { href: "/cwv", label: "Core Web Vitals", icon: Gauge },
      { href: "/landing-perf", label: "Landing-page perf", icon: Gauge },
      { href: "/serp-scans", label: "SERP scans archive", icon: Globe },
    ],
  },
  {
    id: "backlinks",
    title: "Backlinks & outreach",
    items: [
      { href: "/backlinks", label: "Backlinks", icon: Link2 },
      { href: "/link-building", label: "Link building", icon: Link2 },
      { href: "/link-building/prospects", label: "Find prospects", icon: Link2 },
      { href: "/link-building/library", label: "Library (314 sites)", icon: Globe },
      { href: "/outreach", label: "Outreach", icon: Send },
      { href: "/outreach/templates", label: "Outreach templates", icon: Send },
      { href: "/broken-links", label: "Broken links", icon: Link2 },
    ],
  },
  {
    id: "local",
    title: "Local SEO",
    items: [
      { href: "/gbp", label: "Google Business Profile", icon: Building },
      { href: "/citations", label: "Citations", icon: MapPin },
      { href: "/local-rank", label: "Local rank tracker", icon: MapPin },
      { href: "/local-grid", label: "Local rank heatmap", icon: MapPin },
    ],
  },
  {
    id: "competitors",
    title: "Competitors & brand",
    items: [
      { href: "/competitors", label: "Competitors", icon: Network },
      { href: "/competitors/playbook", label: "Competitor playbook", icon: Network },
      { href: "/brand-monitor", label: "Brand monitor", icon: Network },
      { href: "/brand-serp", label: "Brand SERP", icon: Network },
      { href: "/knowledge-panel", label: "Knowledge Panel", icon: Globe },
      { href: "/author-authority", label: "Author authority", icon: Users },
      { href: "/compare", label: "Site compare", icon: GitCompare },
    ],
  },
  {
    id: "ai-visibility",
    title: "AI visibility",
    items: [
      { href: "/ai-visibility", label: "AI visibility tracker", icon: Sparkles },
      { href: "/bot-logs", label: "AI bot logs", icon: Bot },
      { href: "/chats", label: "AI chat history", icon: Bot },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring + history",
    items: [
      { href: "/monitor", label: "Page monitor", icon: Activity },
      { href: "/snapshots", label: "Snapshots", icon: ImageIcon },
      { href: "/annotations", label: "Chart annotations", icon: History },
      { href: "/history", label: "Tool run history", icon: History },
      { href: "/algorithm-updates", label: "Algorithm updates", icon: History },
      { href: "/news", label: "SEO news", icon: Newspaper },
    ],
  },
  {
    id: "imports",
    title: "Imports",
    items: [
      { href: "/import", label: "Import screenshot", icon: ScanText },
      { href: "/capture", label: "Universal capture", icon: Magnet },
      { href: "/csv-import", label: "CSV import", icon: FileDown },
      { href: "/image-audit", label: "Image audit", icon: ImageIcon },
    ],
  },
  {
    id: "deliverables",
    title: "Deliverables",
    items: [
      { href: "/reports/archive", label: "Report archive", icon: FileDown },
      { href: "/automations", label: "Automations", icon: Workflow },
      { href: "/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    id: "account",
    title: "Account",
    pinned: true,
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/learn", label: "Learn", icon: GraduationCap },
      { href: "/knowledge", label: "Knowledge hub", icon: GraduationCap },
    ],
  },
];

const COLLAPSED_KEY = "seo:sidebar-collapsed";
const OPEN_GROUPS_KEY = "seo:sidebar-open-groups";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  unreadByHref,
}: {
  unreadByHref?: Record<string, number>;
} = {}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const unread = unreadByHref ?? {};

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {}
    try {
      const stored = window.localStorage.getItem(OPEN_GROUPS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setOpenGroups(parsed);
      }
    } catch {}
  }, []);

  // Auto-open the group containing the current route — even if the user
  // had it collapsed — so navigation context is always visible.
  useEffect(() => {
    for (const g of groups) {
      if (g.items.some((it) => isActive(pathname, it.href))) {
        setOpenGroups((prev) =>
          prev[g.id] === true ? prev : { ...prev, [g.id]: true },
        );
      }
    }
  }, [pathname]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // Trigger the global SearchPalette via its keyboard shortcut. The palette
  // listens for cmd/ctrl+K; we simulate the keypress so we don't have to
  // wire a context.
  function openSearch() {
    const evt = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(evt);
  }

  return (
    <aside
      className={`glass-apple hidden shrink-0 border-r border-white/[0.06] transition-[width] duration-200 ease-out md:flex md:flex-col ${
        collapsed ? "w-[72px]" : "w-72"
      }`}
    >
      {/* Brand */}
      <div
        className={`relative flex h-[68px] items-center gap-3 border-b border-white/[0.06] ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        <div className="pointer-events-none absolute -left-12 -top-10 size-40 rounded-full bg-violet-500/45 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />
        <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-base font-bold text-white shadow-lg shadow-violet-500/50 ring-1 ring-inset ring-white/30">
          <span className="relative">S</span>
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/35 to-transparent opacity-50" />
          <Sparkles className="absolute -right-1 -top-1 size-3 text-amber-300 drop-shadow-[0_0_5px_oklch(0.85_0.18_75)]" />
        </div>
        {!collapsed && (
          <div className="relative flex min-w-0 flex-1 flex-col leading-none">
            <span className="truncate text-base font-semibold tracking-tight text-foreground">
              SEO tool
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              v0.1 · local
            </span>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="relative grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      )}

      {/* Find anything — opens the global search palette */}
      {!collapsed && (
        <div className="border-b border-white/[0.06] px-3 py-3">
          <button
            type="button"
            onClick={openSearch}
            className="group flex w-full items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-left text-sm text-muted-foreground ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <Search className="size-4 shrink-0 text-violet-300" />
            <span className="flex-1 truncate">Find a tool, client, page…</span>
            <kbd className="hidden rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-inset ring-white/[0.08] sm:inline-flex">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={openSearch}
            title="Find anything (⌘K)"
            aria-label="Find anything"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav
        className={`flex-1 overflow-y-auto py-3 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        {groups.map((group) => {
          const isOpen =
            group.pinned ||
            (openGroups[group.id] ?? group.defaultOpen ?? false);
          return (
            <div key={group.id} className="mb-3">
              {!collapsed && !group.pinned && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  <span>{group.title}</span>
                  {isOpen ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                </button>
              )}
              {!collapsed && group.pinned && (
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {group.title}
                </div>
              )}
              {collapsed && (
                <div
                  aria-hidden
                  className="mx-auto my-2 h-px w-6 bg-white/[0.06]"
                />
              )}
              {(isOpen || collapsed) && (
                <ul className="space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(pathname, href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          title={collapsed ? label : undefined}
                          aria-label={collapsed ? label : undefined}
                          className={
                            collapsed
                              ? `group relative flex h-10 items-center justify-center rounded-lg transition-all ${
                                  active
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                                }`
                              : active
                                ? "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-semibold text-foreground"
                                : "group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-muted-foreground transition-all hover:bg-white/[0.05] hover:text-foreground"
                          }
                        >
                          {active && (
                            <>
                              <span
                                aria-hidden
                                className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/25 via-fuchsia-500/12 to-transparent"
                              />
                              <span
                                aria-hidden
                                className="absolute inset-0 rounded-lg ring-1 ring-inset ring-violet-500/35"
                              />
                              {!collapsed && (
                                <span
                                  aria-hidden
                                  className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-500 shadow-[0_0_12px_oklch(0.7_0.22_275_/_1)]"
                                />
                              )}
                            </>
                          )}
                          <Icon
                            className={`relative size-[18px] shrink-0 transition-colors ${
                              active
                                ? "text-violet-300"
                                : "text-muted-foreground/80 group-hover:text-foreground"
                            }`}
                          />
                          {!collapsed && (
                            <span className="relative flex-1">{label}</span>
                          )}
                          {unread[href] && unread[href] > 0 ? (
                            collapsed ? (
                              <span
                                aria-label={`${unread[href]} new`}
                                className="absolute right-1 top-1 size-2 rounded-full bg-rose-500 ring-2 ring-background"
                              />
                            ) : (
                              <span className="relative ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/40">
                                {unread[href] > 9 ? "9+" : unread[href]}
                              </span>
                            )
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Status line */}
      <div
        className={`border-t border-white/[0.06] py-3 ${
          collapsed ? "px-2" : "px-5"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-[11px] text-muted-foreground/70 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          {!collapsed && <span>Local · everything stays on this machine</span>}
        </div>
      </div>
    </aside>
  );
}
