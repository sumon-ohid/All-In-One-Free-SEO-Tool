@echo off
REM ============================================================
REM  SEO Tool - COLLECT LOGS
REM
REM  Bundles everything needed to debug an install / runtime issue
REM  into a single zip on your Desktop:
REM
REM    - install.log         (output of the installer)
REM    - dev-server.log      (server stdout)
REM    - dev-server.err.log  (server stderr)
REM    - .env.local          (REDACTED - no APP_PASSWORD, no keys)
REM    - System info         (Node + pnpm versions, OS, port state)
REM
REM  After running, the zip will be named like:
REM    SEO-Tool-debug-2026-05-13-1430.zip
REM
REM  Email it to Contact@dicecodes.com or attach to a GitHub issue.
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Build a timestamped filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set "DT=%%I"
set "STAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%-%DT:~8,2%%DT:~10,2%"
set "ZIPNAME=SEO-Tool-debug-%STAMP%.zip"
set "OUTPATH=%USERPROFILE%\Desktop\%ZIPNAME%"
set "STAGE=%TEMP%\seo-debug-%STAMP%"

REM Build a staging folder
if exist "%STAGE%" rd /S /Q "%STAGE%"
mkdir "%STAGE%"

echo Collecting logs into %STAGE%...
echo.

REM Copy logs (silently skip ones that don't exist)
for %%F in (install.log dev-server.log dev-server.err.log) do (
  if exist "%%F" (
    copy /Y "%%F" "%STAGE%\" >nul
    echo   captured  %%F
  )
)
REM Desktop copies (in case install.log isn't in install folder yet)
if exist "%USERPROFILE%\Desktop\SEO-Tool-install.log" (
  copy /Y "%USERPROFILE%\Desktop\SEO-Tool-install.log" "%STAGE%\" >nul
  echo   captured  Desktop\SEO-Tool-install.log
)

REM REDACTED env file - strip secrets
if exist ".env.local" (
  powershell -NoProfile -Command "Get-Content '.env.local' | ForEach-Object { $_ -replace '^(APP_PASSWORD|.*KEY.*|.*TOKEN.*|.*SECRET.*)\s*=.*', '$1=***REDACTED***' } | Set-Content '%STAGE%\env.local.redacted.txt'"
  echo   captured  .env.local  (REDACTED - secrets stripped)
)

REM System info snapshot
> "%STAGE%\system-info.txt" (
  echo SEO Tool debug info - %DATE% %TIME%
  echo.
  echo === OS ===
  ver
  echo.
  echo === Node ===
  where node 2>nul
  node --version 2>nul
  echo.
  echo === Package manager ===
  where pnpm 2>nul
  pnpm --version 2>nul
  where npm 2>nul
  npm --version 2>nul
  echo.
  echo === Port state ===
  powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue ^| Where-Object { $_.LocalPort -in 3000,3001,5555,4000,5000,8080,8081 } ^| Select-Object LocalPort,OwningProcess ^| Format-Table"
  echo.
  echo === Saved port ===
  if exist .seo-port type .seo-port
  echo.
  echo === Running PID ===
  if exist .dev-server.pid type .dev-server.pid
  echo.
  echo === Install folder ===
  echo %CD%
  echo.
  echo === Disk space ===
  powershell -NoProfile -Command "Get-PSDrive C ^| Select-Object Used,Free ^| Format-List"
)
echo   captured  system-info.txt

REM Zip the staging folder
echo.
echo Creating zip: %OUTPATH%
powershell -NoProfile -Command "Compress-Archive -Path '%STAGE%\*' -DestinationPath '%OUTPATH%' -Force"

REM Clean up staging
rd /S /Q "%STAGE%"

echo.
echo ============================================================
echo  Debug zip saved to your Desktop:
echo    %OUTPATH%
echo.
echo  Email it to:    Contact@dicecodes.com
echo  Or attach to:   https://github.com/IamRamgarhia/SEO-Tool/issues
echo.
echo  Note: API keys and APP_PASSWORD have been redacted from
echo  the captured .env.local - safe to share.
echo ============================================================
echo.
pause
endlocal
