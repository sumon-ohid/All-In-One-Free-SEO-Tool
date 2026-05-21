# SEO Tool — Per-Tool Ratings (Usability + Output Quality)

Date: 2026-05-21
Scope: every shippable feature reachable from the app shell.

---

## Factors I'm rating against

**Usability (1-10)** — "can a normal user reach value without help?"
1. Discoverability — can the user find the tool from the nav?
2. Setup friction — works free out-of-box vs needs API keys / OAuth?
3. Plain-language UI — no jargon assumed, terms explained on hover
4. Time-to-first-value — how long until the user sees something useful?
5. Empty state — is the "no data yet" screen helpful or a dead-end?
6. Error visibility — when something fails, does the user know what to do?
7. Mobile / responsive — works on phone screen?
8. Speed — feels instant vs noticeably slow?
9. Recoverability — undo, drafts, autosave?
10. Next-step clarity — is the user told what to do with the result?

**Output Quality (1-10)** — "is the data / insight actually correct and useful?"
1. Data freshness — real-time, daily, weekly, or stale?
2. Source citation — can the user verify where a number came from?
3. False-positive rate — does it flag things that aren't actually problems?
4. False-negative rate — does it miss real problems?
5. Coverage breadth — handles the common case + edge cases?
6. Comparison to paid tools — would Ahrefs/Semrush give a meaningfully better answer?
7. Tech-stack awareness — generic advice vs WordPress/Shopify/Next.js-specific?
8. Action-readiness — output is ready to use, vs requires interpretation?
9. AI / heuristic honesty — flagged as estimate vs presented as fact?
10. Reproducibility — same input → same output?

Scores are honest. Anything ≥8 is genuinely strong. 5-7 = ships but
has obvious gaps. ≤4 = needs work before a normal user should rely on it.

---

## Ratings table

### Workspace / Dashboard

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Home dashboard** (`/`) | 7 | 7 | Morning briefing + priority list + health score works. Empty state weak — new users see numbers without context. |
| **Morning briefing** (`/morning`) | 8 | 7 | "Here's what changed since yesterday" is the killer hook. Quality limited by how much data is connected. |
| **Welcome tour** (`/welcome`) | 6 | n/a | Exists, but the actual first-run wizard inside the app is not enforced — user lands on an empty dashboard if they skip. |
| **Onboarding checklist** (panel) | 7 | n/a | Visible but easy to dismiss. |

### Clients

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Client list** (`/clients`) | 8 | 8 | Solid. Tech stack auto-detection on add is the differentiator. |
| **Add client** (`/clients/new`) | 8 | 8 | Paste URL → detection runs in seconds. Niche tagging is clean. |
| **Client detail** (`/clients/[id]`) | 7 | 7 | A lot of info on one page; can overwhelm new users. |

### Audits (Technical SEO)

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Site audit** (`/audits`) | 7 | 8 | 30+ check coverage is competitive with SEOnaut. Severity classification + Google doc links are strong. |
| **Broken links** (`/broken-links`) | 8 | 8 | Single-purpose, fast, accurate. |
| **Image audit** (`/image-audit`) | 7 | 7 | Catches missing alt + oversized images. Doesn't auto-convert to WebP yet. |
| **Core Web Vitals** (`/cwv`) | 7 | 8 | Pulls from PageSpeed + CrUX. Free + accurate. |
| **Landing page performance** (`/landing-perf`) | 6 | 7 | Sub-tool of CWV; some overlap with /cwv may confuse users. |

### Keywords & Rank

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Keywords** (`/keywords`) | 8 | 7 | Solid table view. Research via autocomplete + PAA is free + works. Quality lower than DataForSEO. |
| **Rank tracker** (`/keywords` + browser mode) | 6 | 6 | Browser-mode rank checking is slow (intentional — free). Mobile vs desktop split is good. SERP-feature detection is partial. |
| **Cannibalization** (`/cannibalization`) | 7 | 8 | Detects multi-page conflicts via GSC data. Very actionable when connected. |
| **Local rank** (`/local-rank`) | 6 | 6 | City-level done via geolocation override. Less precise than Local Falcon. |
| **Local grid** (`/local-grid`) | 6 | 6 | Geo-grid map view exists. Visualization works; underlying rank calls are still browser-mode. |

### Content

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Content workspace** (`/content`) | 7 | 7 | Calendar + brief generator + score. Brief depth depends on AI provider. |
| **Content decay** (`/content-decay`) | 8 | 8 | Pages losing traffic, ranked by recovery value. Direct port of an Ahrefs feature, well-implemented. |
| **Content gap** (`/content-gap`) | 7 | 7 | Competitor SERP overlap. Free version is good; paid SERP API would lift it to 9. |
| **Topic clusters** (`/topic-clusters`) | 6 | 7 | Visual cluster map; UX is dense. |
| **Meta rewriter** (`/meta-rewrite`) | 8 | 8 | "Fix it for me" wizard for title/meta. Strong example of close-the-loop design. |
| **Title A/B tests** (`/title-tests`) | 7 | 7 | CTR-tracking via GSC. Statistically thin on low-traffic sites. |
| **Author authority** (`/author-authority`) | 6 | 6 | EEAT angle. Niche use, light implementation. |

### Backlinks & Outreach

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Backlinks** (`/backlinks`) | 6 | 5 | Honest about limitations. Pulls GSC backlinks (free, accurate but limited) + Common Crawl extracts. Not Ahrefs. |
| **Outreach** (`/outreach`) | 7 | 7 | Prospect pipeline, templates, status tracking. Works as a CRM-lite. |
| **Link building** (`/link-building`) | 6 | 6 | Opportunity finder. Quality depends on which signals are connected. |
| **Guest posts** (`/guest-posts`) | 6 | 6 | Targets list + outreach template. Light. |
| **Broken-link building** (within `/broken-links`) | 6 | 7 | Niche feature, works. |

### AI Visibility / GEO (the 2026 differentiator)

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **AI visibility tracker** (`/ai-visibility`) | 7 | 7 | LLM mention checks across ChatGPT/Perplexity/Claude/Gemini. Genuinely novel; cost-controlled. |
| **Brand monitor** (`/brand-monitor`) | 7 | 7 | Brand mention surface across SERPs + LLMs. |
| **Brand SERP** (`/brand-serp`) | 8 | 8 | What shows when someone Googles your brand name. Solid. |
| **Citations** (`/citations`) | 6 | 7 | Local + AI citation tracking. Dual-purpose can confuse. |
| **Knowledge panel** (`/knowledge-panel`) | 6 | 7 | KP monitoring. Niche. |
| **Bot logs / AI bot tracking** (`/bot-logs`) | 7 | 8 | GPTBot / ClaudeBot / PerplexityBot crawl frequency from logs. Very actionable. |
| **SEO chat** (`/seo-chat`) | 8 | 7 | Ask-the-tool AI chat using user's data. UX is great; output quality depends on provider. |

### Local SEO

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **GBP manager** (`/gbp`) | 7 | 7 | Posts scheduler + photo upload + Q&A. Needs Google API connected. |
| **Citations tracker** (`/citations`) | 6 | 6 | 50+ directories. NAP consistency check works. |
| **Local rank + grid** (above) | 6 | 6 | (See keywords section.) |

### Tasks & Workflow

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Tasks** (`/tasks`) | 8 | 8 | Niche-aware + tech-stack-aware templates. Kanban + list views. Auto-task generation from audits. Closest thing to ClickUp-for-SEO. |
| **Capacity planning** (`/capacity`) | 6 | 6 | Agency-view. Light. |
| **Annotations** (`/annotations`) | 8 | 8 | Notes on chart events. Underrated, well-implemented. |

### Competitors

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Competitors** (`/competitors`) | 7 | 7 | Tracking + content monitoring + SERP overlap. |
| **Compare** (`/compare`) | 7 | 7 | Head-to-head client vs competitor. Visual. |

### Reports & Sharing

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Reports** (`/reports`) | 9 | 8 | The time-saver. PDF + branded + AI exec summary + scheduled. Strongest tool in the app. |
| **Report archive** (`/reports/archive`) | 8 | 8 | Re-download, pin, delete. Clean. |
| **Client portal** (`/portal/[token]`) | 8 | 8 | Magic-link live view. No PDF download required. |
| **Agency weekly digest** (`/digest` + auto-send) | 8 | 8 | Monday-morning email digest. Now retries on send failure (today's fix). |

### Integrations & Settings

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **GSC + GA4 OAuth** (`/settings`) | 8 | 9 | One-click connect. Most-used integration. |
| **WordPress bridge** | 7 | 8 | Plugin shipped (now v0.2.1 with XSS fix). Title/meta/alt write-back works. |
| **API keys / AI providers** | 8 | 8 | 11 providers supported, lazy migration to encryption-at-rest. |
| **Settings** (`/settings`) | 7 | 8 | A lot of toggles on one page; could benefit from sub-sections. |

### Automations & Monitoring

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Automations** (`/automations`) | 6 | 7 | Workflow rules. Quality good, UX dense. |
| **Page change monitor** (`/monitor`) | 7 | 8 | Detects title/H1/meta changes. Quietly very useful. |
| **Notifications** (`/notifications`) | 7 | 7 | Bell + center. Functional. |
| **Capture (browser ext)** (`/capture`) | 6 | 7 | Endpoint for extension; UI exists. Extension itself isn't required. |

### AI Agent & Helpers

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Daily AI agent** (`/agent`) | 8 | 7 | Runs ~17 jobs/client/day. Now logs without leaking pasted secrets (today's fix). |
| **Ask the tool** (`/ask`) | 7 | 7 | Natural-language Q&A on user's data. |
| **Assistant** (`/assistant`) | 7 | 7 | Adjacent to /ask; some duplication. |
| **Chats history** (`/chats`) | 6 | 7 | History view; light. |

### Mini-tools (public-facing, for marketing)

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Free site grader** (`/grader`) | 9 | 8 | The public-facing "audit before signup" funnel. Strong. |
| **Tools directory** (`/tools`) | 8 | 8 | Schema generator, robots validator, hreflang checker, etc. |
| **Invoices** (`/invoices`) | 7 | 8 | Surprisingly polished; PDF route now properly guarded (today's fix). |

### Learn / Knowledge

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Learn** (`/learn`) | 7 | 7 | Lessons + glossary. Content depth could be higher. |
| **Algorithm updates** (`/algorithm-updates`) | 8 | 9 | Auto-correlated with user's data. Very few competitors do this. |
| **News** (`/news`) | 6 | 6 | SEO news aggregator. Light. |
| **Knowledge base** (`/knowledge`) | 6 | 7 | Internal KB. |

### Activity / History / Recovery

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **Activity log** (`/activity`) | 7 | 8 | Who did what when. |
| **History / snapshots** (`/history`, `/snapshots`) | 7 | 8 | Time-series and SERP screenshot history. |
| **Search global** (`/search`) | 8 | 8 | Cross-entity search. Cheap, effective. |
| **Shortcuts** (`/shortcuts`) | 7 | n/a | Keyboard shortcuts panel. Pro-user feature. |

### Imports / Misc

| Tool | Usab. | Quality | Notes |
|------|-------|---------|-------|
| **CSV import** (`/csv-import`) | 8 | 8 | Bulk add clients / keywords. Solid. |
| **Generic import** (`/import`) | 7 | 7 | Adjacent to /csv-import. |
| **Public API** (`/api/v1/*`) | 7 | 7 | Read endpoints + scope check + key auth. Now safer (today's pdfBase64 verification + report list pin). |
| **r/** redirect helper | 8 | n/a | Short-link tracker. |

---

## Headline scores

| Aspect | Score |
|--------|-------|
| **Average usability across all tools** | **7.0 / 10** |
| **Average output quality across all tools** | **7.2 / 10** |
| **For pro users (SEO freelancers / agency)** | **8.0 / 10** |
| **For normal users (small business owners)** | **5.5 / 10** |
| **For complete beginners** | **4.0 / 10** |

### Why the pro-user score is high and the beginner score is low

The app is **dense**. 80+ top-level routes, dozens of charts, tables,
toggles per page. Pros love this — every signal at their fingertips.
Beginners get lost.

Three concrete examples a beginner hits in the first 5 minutes:
1. Empty dashboard with cards labeled "Quick wins" and "Cannibalization"
   — meaning unclear, no tooltip.
2. Settings page has 30+ rows, no sub-sections.
3. /keywords table shows positions 1-100 — but a fresh client with no
   tracked keywords sees an empty table and no prompt to add one.

### The five quickest fixes to bring beginner score from 4 → 7

1. **First-run wizard inside the app** that forces these 3 steps before
   the dashboard becomes interactive: add a client, connect Google
   (skip allowed), pick an AI provider.
2. **Guided mode toggle** that hides 60% of the navigation by default
   (the CLAUDE.md design spec already calls for this — it's not
   enforced in the actual app).
3. **Hover tooltips on every jargon term in the UI** — currently exists
   on some routes, missing on most.
4. **Empty-state prompts on every list view** — "No clients yet — add
   your first" with a big button. Most lists currently just render an
   empty table.
5. **Top-level grouping in the nav** — currently flat: Audits,
   Keywords, Backlinks, Content, AI Visibility, Local, Tasks, Reports,
   Tools, Learn, Settings would map to ~10 groups instead of 80 leaves.

### The five quickest fixes to bring overall output quality from 7.2 → 8.5

1. **Make the AI-generated executive summary cite which numbers it used.**
   Currently it can hallucinate the trend direction on sparse data.
2. **Add a "confidence" badge to every AI-generated suggestion** — the
   CLAUDE.md spec says "Definitely fix this / Probably / Worth testing"
   — implementation today shows them all as equal-weight.
3. **Show "data is X hours old" timestamp on every chart.** GSC has a
   2-day lag; users don't know that.
4. **Backlinks honesty banner**: "We show GSC + Common Crawl extract,
   not a paid index. Pair with Ahrefs Webmaster Tools (free) for full
   coverage." Currently the limitation is documented but not surfaced.
5. **Rank tracking precision indicator**: browser-mode ranks have
   ~1-2 position noise; show this as a confidence band instead of a
   single number.

---

## Additional factors the user asked to consider

The user's prompt mentioned "more factors which we should consider checking."
Beyond the rubric above, these are the dimensions I'd add for a v2 audit:

- **Cost of operating** — running this at scale: how much AI spend per
  client per month? Not yet measured.
- **Self-host RAM/disk footprint over time** — `data.db` and `screenshots/`
  grow without bound. No retention policy enforced.
- **Multi-user collision** — what happens when two team members edit
  the same client / task at the same time? Currently no locking.
- **Privacy posture for AI providers** — when the user sends data to
  OpenAI, what fields get sent? Should be auditable.
- **Browser compatibility** — tested heavily on Chrome; less so on
  Safari mobile. Likely some breakage in the rank-checker UI.
- **i18n readiness** — every user-facing string is hardcoded English.
  The CLAUDE.md spec says "all user-facing text supports i18n from day
  one" — this is not yet true in code.
- **Onboarding completion rate** — we have no instrumentation to know
  what % of new users actually add a client + run an audit. Worth
  adding privacy-respecting counters (no PostHog by default per CLAUDE.md,
  but local-only counters would be fine).
- **Time to first AI insight** — measured to be ~30-60s today. Could
  be cut to <10s with provider-side streaming responses already
  supported by all major providers but not currently used.
- **Backup hygiene** — backup UI exists but no automated daily backup
  by default. Easy win.
- **Error budget for the daily agent** — when a single job in the
  17-job/client pipeline fails, does the rest continue? Spot-checked
  yes, but no formal isolation.

These would shift the overall score from 7.2 → 8.0+ if addressed.
