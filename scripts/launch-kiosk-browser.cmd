@echo off
REM ===========================================================================
REM A.L.A.R.A Safety Board — kiosk browser launcher.
REM Waits for the local server to answer, then opens the board FULLSCREEN in
REM kiosk mode. Prefers Chrome; falls back to Microsoft Edge (always present on
REM Windows 11). Uses a dedicated browser profile so there are no first-run or
REM "restore pages" prompts.
REM
REM Which monitor: kiosk mode fullscreens on the ACTIVE display. With the lid
REM closed (only the external monitor on), that's the external screen — exactly
REM what you want. If you run it with the lid open and it lands on the laptop
REM panel, set the external monitor as your PRIMARY display in Windows settings.
REM ===========================================================================

set "URL=http://localhost:5173"
set "PROFILE=%LOCALAPPDATA%\ALARA-Kiosk"

REM --- Wait for the server (up to ~60s: 30 tries x 2s) --------------------------
set /a tries=0
:wait
curl -s -o nul "%URL%" && goto launch
set /a tries+=1
if %tries% geq 30 goto launch
timeout /t 2 >nul
goto wait

:launch
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%CHROME%" (
  start "" "%CHROME%" --kiosk "%URL%" --user-data-dir="%PROFILE%" --no-first-run --fast --fast-start --disable-session-crashed-bubble --disable-infobars --noerrdialogs --disable-features=TranslateUI --overscroll-history-navigation=0
  goto end
)
if exist "%CHROME86%" (
  start "" "%CHROME86%" --kiosk "%URL%" --user-data-dir="%PROFILE%" --no-first-run --fast --fast-start --disable-session-crashed-bubble --disable-infobars --noerrdialogs --disable-features=TranslateUI --overscroll-history-navigation=0
  goto end
)

REM Fallback: Microsoft Edge single-site fullscreen kiosk.
start "" msedge --kiosk "%URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-session-crashed-bubble --noerrdialogs --user-data-dir="%PROFILE%"

:end
