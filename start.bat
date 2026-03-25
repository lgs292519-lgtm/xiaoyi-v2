@echo off
title XIAOYI Server
cd /d "%~dp0"
echo [XIAOYI] Checking dependencies...
if not exist node_modules (
  echo [XIAOYI] Installing npm dependencies...
  call npm install
  if errorlevel 1 (
    echo [XIAOYI] npm install failed.
    pause
    exit /b 1
  )
)

set PORT=5173
for /l %%P in (5173,1,5200) do (
  netstat -ano | findstr /r /c:":%%P .*LISTENING" >nul
  if errorlevel 1 (
    set PORT=%%P
    goto :port_ok
  )
)

:port_ok
set URL=http://localhost:%PORT%/
echo [XIAOYI] Using port %PORT%
echo [XIAOYI] Opening browser: %URL%
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"

echo [XIAOYI] Starting Vite dev server...
call npm run dev -- --host 0.0.0.0 --port %PORT%
