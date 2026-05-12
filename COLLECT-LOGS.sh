#!/usr/bin/env bash
# ============================================================
#  SEO Tool - COLLECT LOGS
#
#  Bundles everything needed to debug an install / runtime issue
#  into a single zip on your Desktop:
#
#    - install.log         (output of the installer)
#    - dev-server.log      (server stdout)
#    - dev-server.err.log  (server stderr, if any)
#    - env.local.redacted  (REDACTED — no APP_PASSWORD, no keys)
#    - system-info.txt     (Node + pnpm versions, OS, port state)
#
#  After running, the zip will be named like:
#    SEO-Tool-debug-2026-05-13-1430.zip
#
#  Email it to Contact@dicecodes.com or attach to a GitHub issue.
# ============================================================

cd "$(dirname "$0")"

STAMP="$(date +%Y-%m-%d-%H%M)"
ZIPNAME="SEO-Tool-debug-${STAMP}.zip"
DESKTOP="$HOME/Desktop"
OUTPATH="$DESKTOP/$ZIPNAME"
STAGE="$(mktemp -d -t seo-debug-XXXXXX)"

echo "Collecting logs into $STAGE..."
echo ""

# Copy logs (silently skip ones that don't exist)
for f in install.log dev-server.log dev-server.err.log; do
  if [ -f "$f" ]; then
    cp "$f" "$STAGE/"
    echo "  captured  $f"
  fi
done

# Desktop copy of install log (in case install.log isn't in the install folder)
if [ -f "$DESKTOP/SEO-Tool-install.log" ]; then
  cp "$DESKTOP/SEO-Tool-install.log" "$STAGE/"
  echo "  captured  Desktop/SEO-Tool-install.log"
fi

# REDACTED env file — strip secrets before sharing
if [ -f ".env.local" ]; then
  sed -E 's/^(APP_PASSWORD|.*KEY.*|.*TOKEN.*|.*SECRET.*)[[:space:]]*=.*/\1=***REDACTED***/' .env.local > "$STAGE/env.local.redacted.txt"
  echo "  captured  .env.local  (REDACTED - secrets stripped)"
fi

# System info snapshot
{
  echo "SEO Tool debug info - $(date)"
  echo ""
  echo "=== OS ==="
  uname -a 2>/dev/null
  if [ -f /etc/os-release ]; then cat /etc/os-release; fi
  echo ""
  echo "=== Node ==="
  command -v node >/dev/null && { which node; node --version; } || echo "node not found"
  echo ""
  echo "=== Package manager ==="
  command -v pnpm >/dev/null && { which pnpm; pnpm --version; } || echo "pnpm not found"
  command -v npm  >/dev/null && { which npm;  npm --version;  } || echo "npm not found"
  echo ""
  echo "=== Port state ==="
  if command -v lsof >/dev/null 2>&1; then
    for p in 3000 3001 5555 4000 5000 8080 8081; do
      lsof -i :$p -sTCP:LISTEN 2>/dev/null
    done
  elif command -v ss >/dev/null 2>&1; then
    ss -lnt 2>/dev/null | grep -E ':(3000|3001|5555|4000|5000|8080|8081) '
  fi
  echo ""
  echo "=== Saved port ==="
  [ -f .seo-port ] && cat .seo-port
  echo ""
  echo "=== Running PID ==="
  [ -f .dev-server.pid ] && cat .dev-server.pid
  echo ""
  echo "=== Install folder ==="
  pwd
  echo ""
  echo "=== Disk space ==="
  df -h . 2>/dev/null
} > "$STAGE/system-info.txt"
echo "  captured  system-info.txt"

# Zip the staging folder
echo ""
echo "Creating zip: $OUTPATH"
if command -v zip >/dev/null 2>&1; then
  (cd "$STAGE" && zip -q "$OUTPATH" .)
elif command -v tar >/dev/null 2>&1; then
  # Fallback to .tar.gz if zip unavailable
  OUTPATH="${OUTPATH%.zip}.tar.gz"
  tar czf "$OUTPATH" -C "$STAGE" .
fi

# Clean up
rm -rf "$STAGE"

echo ""
echo "============================================================"
echo " Debug bundle saved to your Desktop:"
echo "   $OUTPATH"
echo ""
echo " Email it to:    Contact@dicecodes.com"
echo " Or attach to:   https://github.com/IamRamgarhia/SEO-Tool/issues"
echo ""
echo " Note: API keys and APP_PASSWORD have been redacted from"
echo " the captured .env.local — safe to share."
echo "============================================================"
echo ""

if [ -t 0 ]; then
  read -p "Press Enter to close..." _ 2>/dev/null || true
fi
