@echo off
REM SEO Tool launcher. Starts the dev server on a chosen port and
REM (optionally) opens the browser when it's reachable.
REM
REM Env vars:
REM   PORT          target port (default 3000)
REM   SEO_RESTART   when set to 1, skips opening a fresh browser tab
REM                 (the existing tab will reload itself via health-ping)

setlocal
cd /d "%~dp0"

REM Resolve PORT in priority order:
REM   1. Caller's env (e.g. /api/restart passes it explicitly)
REM   2. .seo-port file written by the server while running
REM   3. Default 3000
if "%PORT%"=="" (
  if exist ".seo-port" (
    set /p PORT=<.seo-port
  )
)
if "%PORT%"=="" set "PORT=3000"

REM Find pnpm or npm
where pnpm >nul 2>&1
if %errorlevel%==0 (
  set "PM=pnpm"
) else (
  where npm >nul 2>&1
  if %errorlevel%==0 (
    set "PM=npm"
  ) else (
    echo Node / npm not found. Install Node 20+ from https://nodejs.org
    pause
    exit /b 1
  )
)

REM Already running on this port?
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri http://localhost:%PORT% -TimeoutSec 1).StatusCode | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  if not "%SEO_RESTART%"=="1" start "" "http://localhost:%PORT%"
  exit /b 0
)

REM On restart, give the old server a moment to free the port before we
REM try to bind it. 2 seconds is more than enough for process.exit(0).
if "%SEO_RESTART%"=="1" timeout /t 2 /nobreak >nul

REM Start the dev server fully hidden — no flashing cmd window. We use
REM PowerShell's Start-Process -WindowStyle Hidden so there's nothing
REM in the taskbar. Output is redirected to a log file the user can
REM open if they need to debug. Stop the server via the in-app power
REM widget (calls /api/shutdown) or via Task Manager (look for node.exe).
powershell -NoProfile -Command "Start-Process -FilePath cmd -ArgumentList '/c %PM% dev --port %PORT% > dev-server.log 2>&1' -WindowStyle Hidden -WorkingDirectory '%CD%'"

REM Wait for the server to come up (up to 60s) then open browser
powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { (Invoke-WebRequest -UseBasicParsing -Uri http://localhost:%PORT% -TimeoutSec 1).StatusCode | Out-Null; break } catch { Start-Sleep -Seconds 1 } }"
if not "%SEO_RESTART%"=="1" start "" "http://localhost:%PORT%"
endlocal
