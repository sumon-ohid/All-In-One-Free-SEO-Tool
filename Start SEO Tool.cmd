@echo off
REM ============================================================
REM   SEO Tool — Start
REM   Double-click this file to start the server.
REM   Browser opens automatically once it's ready.
REM ============================================================
REM
REM This is a thin wrapper around bin\START.cmd so users have a
REM "click me" file right at the install root without digging into
REM bin\. All the real logic (port discovery, health probe,
REM app-window browser open, graceful restart) lives in bin\START.cmd.

setlocal
cd /d "%~dp0"
call bin\START.cmd
