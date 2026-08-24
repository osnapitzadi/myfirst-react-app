@echo off
REM ===========================================================================
REM A.L.A.R.A Safety Board — kiosk server launcher.
REM Starts the Vite server (serves public/, where the daily pull writes
REM today.json) at http://localhost:5173. Launched by Task Scheduler at logon;
REM runs for as long as the kiosk is on. Uses node directly so the PowerShell
REM execution policy never blocks it.
REM %~dp0.. is the project root, so this keeps working if the folder moves.
REM ===========================================================================
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" --host --port 5173 >> "%~dp0serve-kiosk.log" 2>&1
