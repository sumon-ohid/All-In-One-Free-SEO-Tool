# Install / Run improvements — what shipped + what's worth shipping next

Context: a request for "easiest install, no port conflicts, restart like
clicking a desktop icon." This doc records what we just shipped, plus a
prioritized backlog of further improvements you can pick from.

---

## Shipped just now

### 1. Deterministic port in the IANA ephemeral range (49152–65535)

**Was:** installer + launchers fell back through a hardcoded list
`3000, 3001…3010, 8080, 8081, 4000, 5000`. Every one of those is a
well-known dev default — Next, Vite, Rails, Django, generic, etc. —
so a developer with one other app open would hit collisions.

**Now:** fresh installs pick a port deterministically from a SHA-256
hash of the absolute install path, mapped into `49152 + (n % 16383)`.
That range is IANA's "Dynamic/Private" pool — explicitly reserved for
ephemeral use, no well-known apps bind there. Different install
directories get different ports automatically.

**Backwards compat:** if `.seo-port` already exists, the existing
port is honored unchanged so old bookmarks still work. `SEO_PORT`
env var still overrides everything.

Canonical impl: [scripts/pick-port.cjs](../scripts/pick-port.cjs).
Mirrored inline in PowerShell ([install.ps1](../install.ps1)) and
bash ([install.sh](../install.sh)) so the installers don't depend on
Node existing before they install Node.

### 2. Auto-start at login (opt-in)

Pass `SEO_AUTOSTART=1` to the installer and it registers:

- **Windows:** a per-user Scheduled Task ("SEO Tool - Start at
  login"). No admin rights required. Runs `bin/START.cmd` hidden at
  user logon.
- **macOS:** a LaunchAgent at
  `~/Library/LaunchAgents/com.dicecodes.seo-tool.plist`. Loaded
  immediately and on every login.
- **Linux:** a `systemd --user` unit at
  `~/.config/systemd/user/seo-tool.service`, enabled with
  `systemctl --user enable`. For headless servers (start without
  active login), the installer prints the one-time
  `sudo loginctl enable-linger $USER` follow-up.

Opt-in by design — most people don't want a server running silently
after every boot. Set the env var, re-run the installer.

---

## Backlog — sorted by impact / effort

### Tier 1: high impact, low effort

1. **System-tray icon** — when the server is running, a tiny tray
   icon with right-click menu: Open / Stop / Restart / Logs / Update.
   Gives the user visual confirmation it's alive (currently invisible)
   and replaces both desktop shortcuts.
   Approach: `systray` or `tray-icon` npm package, ~3 MB binary, no
   Electron needed. Add as a `bin/seo-tray.cjs` that spawns alongside
   the server.

2. **`--app=URL` browser mode** — if Chrome / Edge / Brave is
   detected, open the app via `chrome --app=http://localhost:PORT`
   instead of a normal tab. Gives the user a dedicated window with
   no URL bar, no tabs — essentially a free PWA experience without
   needing a manifest install flow.

3. **First-run wizard inside the app** — empty dashboard is hostile.
   On first visit (no clients exist) push to a 3-step setup:
   (1) paste a domain to audit, (2) connect Google (skip is fine),
   (3) pick an AI provider. We have the data; we just don't gate the
   flow.

4. **In-app "Update now" button** — Settings → System health →
   "Check for updates." Pulls the ZIP, runs migrate, restarts. Removes
   the "re-run the install one-liner" friction.

5. **Defender / antivirus exclusion prompt** — first start is
   noticeably slower because Defender scans every file in
   `node_modules` and the Playwright Chromium binary. PowerShell can
   add an exclusion with one `Add-MpPreference -ExclusionPath` call
   (admin needed). Prompt; explain what it does.

### Tier 2: meaningful effort, big payoff

6. **Single-file binary for Windows + macOS** — biggest install
   failure mode is "Node missing / Node too old / C++ toolchain
   missing." Ship a single `.exe` (Windows) and `.dmg` (macOS) that
   bundles Node + the app + a launcher. Two options:

   - **`pkg` / `nexe`:** old, mature, ~80 MB binary. Limitation:
     can't bundle the Playwright Chromium download — still has to
     fetch ~170 MB on first run.
   - **Tauri-sidecar pattern:** Tauri Rust shell + bundled Node
     binary as a sidecar. ~30 MB shell, runs the existing Next.js
     app. Gives us a "real app icon in the Start Menu / Dock" + tray
     for free. Most effort but the cleanest user experience.

   Either eliminates the entire "do I have the right Node?" problem.

7. **Self-hosted updater** — like (4) but checking against a JSON
   manifest on the GitHub Releases page. Show "New version X.Y
   available — release notes — install now" with a one-click apply.

8. **macOS installer signing + notarization** — without it, macOS
   Gatekeeper blocks `.command` files on first open with a scary
   warning. ~$99/year Apple Developer account; non-trivial process
   but kills the friction for Mac users entirely.

9. **Crash auto-restart** — the systemd unit has `Restart=on-failure`
   already. Add the same idea on Windows (Task Scheduler trigger:
   "on event 1000 from app source" → re-run START.cmd) and macOS
   (LaunchAgent `KeepAlive` true). Currently if the Node process
   crashes, the user has to manually re-click "Start SEO Tool."

10. **Graceful shutdown signal** — `STOP.cmd` does `Stop-Process
    -Force` which is the Windows equivalent of SIGKILL. SQLite
    WAL mode usually handles this fine, but a clean SIGTERM (let
    the Node process flush, close DB handles, finish any in-flight
    write) is safer. Send `taskkill /PID <pid>` first (graceful),
    wait 5s, then `/F` only if needed.

### Tier 3: niche but valuable

11. **Multi-install workspace switcher** — if a user does run two
    installs (work + personal SEO clients), the tray menu lists both
    and lets them switch which is "current." Each install already
    gets its own port deterministically.

12. **`seo doctor` subcommand** — `node bin/seo.cjs doctor` prints
    a health report: Node version, package manager, port chosen,
    DB integrity check, Chromium status, disk space, last error in
    `dev-server.log`. Replaces 90% of GitHub-issue "what version of
    everything do you have" replies.

13. **Per-install Windows Start-Menu entry** — currently we drop
    desktop shortcuts. Adding to the Start Menu's "Programs" list
    makes the app findable via Windows search ("seo tool" → Enter).
    One extra `CreateShortcut` call into `$env:APPDATA\Microsoft\
    Windows\Start Menu\Programs`.

14. **Welcome email / Slack message on first start** — if the user
    configured SMTP or Slack webhook during install, send a "you're
    set up, here's what to do next" message. Reuses the existing
    mailer + webhook infrastructure.

15. **Auto-detect when port collides with our other install** — if
    `.seo-port` shows port X and X is in use by ANOTHER install of
    this app at a different path, surface that in the UI: "Another
    SEO Tool instance is running on this port — open
    http://localhost:X or stop the other instance."

16. **`bin/seo update`** — pulls the latest ZIP, preserves
    `data.db` + `.seo-encryption-key` + `.env.local`, runs migrate,
    restarts. Same as re-running the install one-liner but reachable
    from the tray and from inside the app.

17. **Better STOP behavior on Windows** — when STOP.cmd runs, the
    "started" terminal window from START.cmd lingers briefly. A small
    polish: also close the dev-server.cmd window via window-title
    targeting.

### Tier 4: nice-to-have polish

18. **Custom desktop icon** — desktop shortcuts already pick up
    `public/favicon.ico`. Ship a higher-resolution `.ico` (256x256
    multi-resolution) so it looks crisp in File Explorer's largest
    icon view.

19. **Move runtime junk into `.runtime/`** — `dev-server.log`,
    `dev-server.err.log`, `.dev-server.pid`, `.dev-server.cmd` all
    sit in the install root and clutter it. A `.runtime/` subdir
    would keep the root clean. Migration: STOP.cmd / START.cmd check
    both old + new locations during a one-version transition.

20. **"Run as a system service" on Linux** — for users running this
    on a VPS with no desktop, a `--system` flag that installs the
    systemd unit at `/etc/systemd/system/` instead of `~/.config/
    systemd/user/`. Requires sudo, but unlocks the headless-server
    use case the user can already do manually.

---

## What I'd ship next, if it were my call

In order:
1. **System tray icon (1)** — biggest UX gap right now. Free PWA
   feel + visual confirmation + obvious stop button.
2. **`--app=URL` browser mode (2)** — five lines of code, huge perception jump.
3. **First-run wizard inside the app (3)** — the empty dashboard is
   the actual onboarding problem; everything else is plumbing.
4. **Defender exclusion prompt (5)** — invisible speedup, no UI.
5. **Single-file binary via Tauri-sidecar (6)** — biggest reach
   improvement (every non-developer install today fails on Node /
   C++ toolchain). Several days of work but it's the difference
   between "self-hostable by SEOs" and "self-hostable by developers
   only."

The user said "make it feel like clicking a desktop icon and it
runs." (1) + (2) + a one-time installer that doesn't need Node = that
exact experience.
