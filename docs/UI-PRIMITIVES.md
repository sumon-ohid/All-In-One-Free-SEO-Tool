# Shared UI primitives — migration cheat sheet

Four shared components shipped in Move #3 of the 90-day plan. Apply
them everywhere — they're the cheapest single lever for the
"beginner usability" score.

---

## 1. `<EmptyState>` — for any list / panel with no data yet

**File:** [src/components/ui/empty-state.tsx](../src/components/ui/empty-state.tsx)

```tsx
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState
  icon={Users}
  title="No clients yet"
  body="Add your first website to unlock audits, keyword tracking, and reports."
  primary={{ href: "/clients/new", label: "Add a client" }}
  secondary={{ href: "/learn", label: "How does this work?" }}
/>
```

Sizes: `sm` (in-card), `md` (default, page-center), `lg` (full-page).

**When to use:** every list, table, or panel that can be empty.
**Anti-pattern:** rendering an empty table with just column headers
(no prompt for what to do next).

---

## 2. `<FreshnessBadge>` — pill showing "5m ago" / "2h ago" / "yesterday"

**File:** [src/components/ui/freshness-badge.tsx](../src/components/ui/freshness-badge.tsx)

```tsx
import { FreshnessBadge } from "@/components/ui/freshness-badge";

<FreshnessBadge capturedAt={chart.lastSyncedAt} source="GSC" />
<FreshnessBadge capturedAt={audit.completedAt} source="Audit" />
```

Color tiers compute themselves from the timestamp:
- emerald: ≤ 1h (live)
- neutral: ≤ 24h (today)
- amber: ≤ 7d (this week)
- red: > 7d (stale)

**When to use:** every chart / table / panel sourced from a periodic
sync. GSC has a 2-day lag — users currently have no way to know that.

---

## 3. `<JargonTerm>` — dotted-underline hover glossary

**File:** [src/components/ui/jargon-term.tsx](../src/components/ui/jargon-term.tsx)

```tsx
import { JargonTerm } from "@/components/ui/jargon-term";

<p>
  Your <JargonTerm term="canonical" /> tag tells Google which version
  of a page is the main one.
</p>

// Custom definition for an off-glossary term:
<JargonTerm term="rel=nofollow" definition="Tells Google not to follow this link or pass authority to its destination.">
  rel="nofollow"
</JargonTerm>
```

25+ built-in glossary entries: canonical, meta description, title tag,
serp, ctr, cwv, lcp, cls, inp, schema, rich result, alt text, hreflang,
robots.txt, sitemap, cannibalization, content decay, striking distance,
share of voice, e-e-a-t, ai overview, geo, llms.txt, backlink,
anchor text, nap, gbp, gsc, ga4, indexability, page experience.

Unknown terms render as plain text (safe to sprinkle anywhere).

**When to use:** any user-facing copy containing acronyms or
SEO-industry terms. Especially in audit issue cards, content briefs,
and the morning briefing.

---

## 4. `<ConfidenceBadge>` — AI / heuristic confidence pill

**File:** [src/components/ui/confidence-badge.tsx](../src/components/ui/confidence-badge.tsx)

```tsx
import { ConfidenceBadge } from "@/components/ui/confidence-badge";

<ConfidenceBadge
  level="definitely"
  reason="Title exceeds 60 chars and gets truncated in 90% of SERPs (Google docs)"
/>

<ConfidenceBadge
  level="probably"
  reason="Schema markup increases CTR by ~10% on average in our test set"
/>

<ConfidenceBadge
  level="test"
  reason="Heuristic suggestion — A/B test before committing"
/>
```

Three levels enforce the CLAUDE.md spec ("Definitely fix this /
Probably worth it / Worth testing").

**When to use:** every AI-generated suggestion, every heuristic
verdict, every "consider doing X" prompt. Current code shows them
all as equal-weight; this breaks that and forces the model to admit
uncertainty.

---

## Where to retrofit first (priority order)

1. **Audit issue cards** — every issue gets a `ConfidenceBadge` + the
   issue title gets `JargonTerm` wrapping. Highest-impact spot:
   issues are the closest thing to "the user must read this and act."

2. **Dashboard "Latest audit" panel** — `FreshnessBadge` on the
   timestamp. Same on the morning briefing.

3. **Empty tables across the app** — every `if (rows.length === 0)`
   should reach for `<EmptyState>`. Grep:
   ```
   rg "length === 0" src/app | grep -v 'page.tsx' | head -20
   ```

4. **Settings page** — wrap acronyms in `JargonTerm` (NAP, GSC, GA4,
   CWV, hreflang, etc.) so a beginner doesn't have to Google them.

5. **Reports exec summary** — `ConfidenceBadge` on each AI claim.
   Dovetails with Move #4 (cite-or-bust).

The pattern compounds: once a tool uses all four primitives, its
usability score lifts roughly 1.5 points without any feature work.
