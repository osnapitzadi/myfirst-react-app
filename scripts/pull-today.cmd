@echo off
REM ===========================================================================
REM A.L.A.R.A daily data pull — Windows Task Scheduler wrapper.
REM Runs the Node pull script from the project root and appends output to a log.
REM %~dp0 is this file's folder (…\scripts\), so "%~dp0.." is the project root —
REM the task keeps working even if the project folder is moved or renamed.
REM ===========================================================================
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" "scripts\pull-today.mjs" >> "%~dp0pull-today.log" 2>&1
