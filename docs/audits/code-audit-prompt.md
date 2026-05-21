# Code-Audit Prompt (for ANY AI reviewer)

Paste the prompt below into Claude / GPT / Gemini / Cursor / etc. with
the repo accessible (most AI coding tools have file access). The
output is a prioritized list of real, actionable bugs — not nits.

Complementary to `user-journey-audit-prompt.md`:
- **user-journey** targets install + first-run + UX flow bugs
- **code-audit** (this file) targets security + correctness + perf
  + dead-code at the code-architecture level

---

## The prompt

Audit this codebase as a senior engineer doing a final pre-release
security + correctness + performance review.

### What this is

A self-hosted SEO platform (Next.js 16 App Router, React 19, TypeScript
strict). 150+ tools across audits, rank tracking, content, backlinks,
local SEO, AI-search visibility, paid-ads funnels, white-label reports.
Single-user / single-machine. No multi-tenancy. Data lives in one
SQLite file. License: PolyForm Noncommercial.

### Threat model (read this first — it bounds the audit)

- **Primary attacker:** another local process on the user's machine
  (malicious npm package in node_modules, browser tab, dev tool).
  Server binds to 127.0.0.1 by default — the LAN attacker is OUT OF
  SCOPE unless the user explicitly set `SEO_BIND_HOST=0.0.0.0` AND
  `APP_PASSWORD` is unset (which we already block).
- **Secondary attacker:** anyone who gets a copy of the user's
  `data.db` file (leaked backup, stolen laptop). Encrypted columns
  must stay encrypted.
- **Out of scope:** social engineering, kernel exploits, supply-chain
  attacks on npm itself.

### Key surfaces (prioritize in this order)

1. **`src/lib/admin-auth.ts`** — the guard for `/api/restart`,
   `/api/shutdown`, `/api/backup`, `/api/restore`, `/api/update`,
   `/api/desktop-shortcut`. Threats: header spoofing, auth bypass.

2. **`src/lib/crypto.ts`** + `src/lib/data-dir.ts` — AES-256-GCM
   for API keys + OAuth tokens. Threats: key reuse, IV reuse, key
   leakage to logs, decrypt-on-error returning ciphertext to client.

3. **`src/app/api/v1/*` routes** — public REST API with Bearer-token
   auth. Threats: missing auth, returning encrypted blobs to read-
   scope, missing input validation, IDOR.

4. **`src/app/api/*` admin routes** — `/restart`, `/shutdown`,
   `/backup`, `/restore`, `/update`, `/desktop-shortcut`,
   `/report-archives/[id]/pdf`, `/clients/[id]/skip-branding`.
   Threats: missing `guardAdminRequest`, command injection in
   child_process spawns, path traversal in file ops.

5. **`src/db/client.ts`** + `src/db/schema.ts` + `scripts/migrate.cjs`
   — Drizzle ORM + better-sqlite3. Threats: raw SQL injection, missing
   transaction boundaries, migration non-idempotency on partial apply,
   WAL mode + concurrent-write hazards.

6. **`src/lib/browser-pool.ts`** + `src/lib/rank-checker.ts` +
   `src/lib/serp-scanner.ts` + `src/lib/local-cwv.ts` — Playwright
   browser pool. Threats: resource exhaustion (zombie browsers), SSRF
   (user-supplied URLs scraped without validation), launch race
   conditions, semaphore leaks.

7. **`src/lib/ai-call.ts`** + `src/lib/ai-semaphore.ts` +
   `src/lib/providers/*` — unified AI client for OpenAI / Anthropic /
   Gemini / Groq / OpenRouter / DeepSeek / Perplexity / Ollama.
   Threats: API key leakage to logs, prompt injection from user-pasted
   content, missing rate-limit backoff, unhandled provider 5xx.

8. **`src/lib/wp-bridge.ts`** + WordPress plugin
   (`wordpress-plugin/seo-tool-bridge.php`) — bidirectional REST.
   Threats: Bearer-token replay, SSRF to internal IPs via WP URL,
   plugin auth bypass.

9. **`src/lib/og-image.ts`** + `src/lib/weekly-digest.ts` +
   PDF reports — Satori + resvg + PDFKit + nodemailer. Threats:
   XSS in PDF (user-supplied content rendered to HTML→PDF), SSRF
   in image-URL fetches, SMTP credential leakage.

10. **`install.ps1` + `install.sh` + `bin/*`** — install + launcher
    scripts. Threats: command injection via env vars, unsafe
    `eval`/`iex`-equivalent, path traversal in file copies, port
    fallback infinite loop.

11. **`docker-compose.yml` + `Dockerfile`** — Docker deploy.
    Threats: container-side env leakage, volume permission issues,
    runtime running as root, secrets baked into image.

12. **Daily-agent jobs** — `src/lib/daily-agent.ts` +
    `src/lib/daily-automations.ts` + `src/app/agent/*`. Threats:
    runaway loops, missing cooldowns, AI cost explosion, cron drift.

### What to look for (NOT exhaustive — apply judgment)

**Security:**
- Auth gates missing on mutation endpoints
- Spoofable trust signals (Host header, x-forwarded-for without proxy)
- SSRF: do we validate user-supplied URLs before fetch?
- Command injection: anywhere user input flows into `spawn`/`exec` args
- Path traversal: `path.join(userInput)` without `path.resolve` + prefix check
- SQL injection: any `sqlite.exec` / `sqlite.prepare` taking user input directly
- IDOR: `/api/v1/clients/:id` — does the caller's scope cover that client?
- Encryption: `encrypt`/`decrypt` round-trip integrity, IV uniqueness
- Secrets in logs: any `console.log` / `Write-Host` / Sentry call passing API keys
- Crypto downgrade: any `Math.random()` where `crypto.randomBytes` should be
- CSRF: state-changing POSTs without anti-CSRF (less relevant for localhost-only, but check LAN-exposed config)

**Correctness:**
- Missing `await` on async DB calls (Drizzle returns thenable builders — partially-built queries that look done but aren't)
- Unhandled promise rejections in server actions / route handlers
- Race conditions on shared mutable state (browser pool, semaphore, port file)
- Migrations not idempotent — same migration applied twice ≠ no-op
- Server-component code calling client-only APIs (window, document, navigator)
- Edge runtime routes importing node-only modules (fs, child_process, better-sqlite3)
- TypeScript `any` / `as` casts hiding real type errors
- Schema mismatch between Drizzle types and actual SQLite columns

**Performance:**
- N+1 queries (server component calling DB inside a `.map`)
- Synchronous file IO in route handlers (`readFileSync` instead of `readFile`)
- Memory leaks: event listeners attached but never removed, intervals never cleared
- Browser pool: contexts created but not closed, page handlers leaking
- Bundle bloat: importing big modules in client components (date-fns whole instead of subset, etc.)
- Missing pagination on `/api/v1/*` list endpoints
- Repeated DB queries that could be batched / cached

**Privacy:**
- Anything outbound that isn't user-initiated (telemetry, error reporting, "phone home")
- PII in error logs (email addresses, API keys, OAuth tokens)
- Logs that include the full DB row when only IDs should appear
- Browser fingerprint leakage (Playwright fingerprint defaults are scrapeable)

**Dead code:**
- npm dependencies not imported anywhere
- Files in `src/` never imported
- Exported functions never called
- Commented-out blocks > 5 lines
- TODOs older than 6 months (use `git blame`)

### Reporting format (strict)

For each issue:

- **Severity:** Critical (RCE / data exposure / loss) / High (auth
  bypass / data corruption) / Medium (UX degradation / mild leakage)
  / Low (cosmetic / nit-but-real)
- **Category:** Security / Correctness / Performance / Privacy / Dead-code
- **File:line** — exact location
- **Reproduction:** 1-3 lines showing the attack or trigger
- **Root cause:** 1-2 sentences
- **Fix:** specific code change. Show the patch, don't just describe.

### Skip

- Style / formatting nits
- TypeScript improvements that don't catch a real bug
- "Could be more idiomatic" suggestions
- Findings below 80% confidence
- Suggestions to add tests (the project doesn't have a test suite
  yet; that's a separate larger conversation, not a per-bug finding)

### Output

End the report with a **prioritized fix list** (top 15) the
maintainer can ship in order. Critical first, then High, then
Medium. Cap at 15 even if you find more — focus on the worst.

Time budget: 45-90 minutes of careful reading. The 12 priority
surfaces above are the highest-impact. Cover them all before
spending time elsewhere.

---

## How to use this prompt

1. Open the AI reviewer of your choice (must have file access to
   this repo — Claude Code, Cursor, Cody, Aider, etc.)
2. Paste the prompt above starting from "Audit this codebase..."
3. Wait for the report
4. Cross-check findings against your own intuition — AI reviewers
   sometimes hallucinate bugs that don't exist
5. Open one issue per Critical/High finding; batch the Medium /
   Low into a single follow-up issue
6. For any finding you can't verify, ask the AI to prove the
   vulnerability with a reproduction (curl command, test case, etc.)

## When to re-run

- Before any release tagged `v0.X` (minor) or `v1.0`
- After significant changes to: admin-auth, crypto, db schema,
  AI provider integration, install scripts
- Quarterly even with no changes — npm ecosystem moves
