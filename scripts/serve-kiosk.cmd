@echo off
REM ===========================================================================
REM A.L.A.R.A Safety Board — kiosk server launcher (keep-alive).
REM Starts the Vite server (serves public/, where the daily pull writes
REM today.json) at http://localhost:5173, and RELAUNCHES it automatically if it
REM ever exits or crashes — so it doesn't depend on Task Scheduler's flaky
REM "restart on failure." Launched by Task Scheduler at logon.
REM
REM Uses node directly so the PowerShell execution policy never blocks it.
REM %~dp0.. is the project root, so this keeps working if the folder moves.
REM ===========================================================================
cd /d "%~dp0.."
title ALARA Kiosk Server

:loop
echo [%date% %time%] starting server >> "%~dp0serve-kiosk.log"
"C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" --host --port 5173 >> "%~dp0serve-kiosk.log" 2>&1
echo [%date% %time%] server exited (code %errorlevel%) — restarting in 5s >> "%~dp0serve-kiosk.log"
timeout /t 5 /nobreak >nul
goto loop
