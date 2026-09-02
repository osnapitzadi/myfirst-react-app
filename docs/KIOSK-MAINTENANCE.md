# A.L.A.R.A Safety Board — Kiosk Maintenance Guide

How to run, restart, and look after the headless kiosk on the display laptop.

The board runs as a **hidden background server** (no window) plus a fullscreen
browser. Because the server is windowless, you manage it with the commands
below rather than by looking for a console.

- **Board URL:** http://localhost:5173
- **Project folder:** `C:\Users\Shipping\Desktop\myfirst-react-app-master`
- **Open the settings drawer on the board:** press `S`

> Run the commands below in **PowerShell** or **Command Prompt**. A few (marked
> *admin*) need an elevated window: right-click the terminal → **Run as
> administrator**.

---

## The moving parts

Three scheduled tasks run everything. All start automatically at logon.

| Task name | What it does | Trigger |
|-----------|--------------|---------|
| **ALARA Kiosk Server** | Runs the board server (hidden, self-restarting) | At logon |
| **ALARA Daily Pull** | Refreshes weather / radiation / isotope data | 6 AM daily + logon; catches up if the PC was off |
| **ALARA Kiosk Browser** | Opens the board fullscreen (Chrome, else Edge) | At logon (waits for the server) |
| **ALARA Screens Off** | Turns off all connected screens | 2:00 PM daily |
| **ALARA Screens On** | Wakes all connected screens | 6:00 AM daily |

Supporting files (in `scripts\`):

- `serve-kiosk.cmd` — the keep-alive loop that (re)launches the server
- `serve-kiosk-hidden.vbs` — runs the above with **no window**
- `pull-today.cmd` / `pull-today.mjs` — the daily data pull
- `launch-kiosk-browser.cmd` — opens the fullscreen browser
- `kiosk-power-setup.cmd` — one-time power/lid configuration
- `screens-off.ps1` / `screens-on.ps1` — turn the displays off / wake them
- `*.log` — run logs (git-ignored)

---

## Everyday tasks

### Restart the server
```bash
schtasks /End /TN "ALARA Kiosk Server"
schtasks /Run /TN "ALARA Kiosk Server"
```

### Check the server is running (port 5173 should be listening)
```bash
powershell -c "(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count"
```
`1` = up, `0` = down. If it's `0`, run the restart commands above.

### Stop the server
```bash
schtasks /End /TN "ALARA Kiosk Server"
```

### Refresh the data right now (don't wait for 6 AM)
```bash
schtasks /Run /TN "ALARA Daily Pull"
```
The board picks up new data within ~10 minutes on its own; to see it
immediately, refresh the browser (see below).

### Reload / relaunch the fullscreen board
```bash
schtasks /Run /TN "ALARA Kiosk Browser"
```
Or, in the open board, press **Ctrl+R** to reload, or **Alt+F4** to close it
(the task will reopen it at next logon, or run the command above).

### See what the tasks did
```bash
schtasks /Query /TN "ALARA Kiosk Server" /V /FO LIST
schtasks /Query /TN "ALARA Daily Pull" /V /FO LIST
```
Look at **Last Run Time** and **Last Result** (`0` = success).

### Read the logs
```bash
type "C:\Users\Shipping\Desktop\myfirst-react-app-master\scripts\serve-kiosk.log"
type "C:\Users\Shipping\Desktop\myfirst-react-app-master\scripts\pull-today.log"
```

---

## Updating the board (after code changes)

From the project folder:
```bash
cd C:\Users\Shipping\Desktop\myfirst-react-app-master
git pull
schtasks /End /TN "ALARA Kiosk Server"
schtasks /Run /TN "ALARA Kiosk Server"
```
Then reload the browser (**Ctrl+R**) or rerun the browser task. If dependencies
changed, run `npm.cmd install` before restarting the server.

> Note: `npm run dev` fails in PowerShell with a script-execution-policy error.
> Use `npm.cmd install` / `npm.cmd run dev`, or once run
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (*admin* not required).

---

## First-time / after-reimaging setup

Run these once to (re)install everything:

```bash
cd C:\Users\Shipping\Desktop\myfirst-react-app-master

:: install the tasks
schtasks /Create /TN "ALARA Kiosk Server"  /XML "scripts\alara-serve-kiosk.xml"  /F
schtasks /Create /TN "ALARA Daily Pull"    /XML "scripts\alara-pull-today.xml"    /F
schtasks /Create /TN "ALARA Kiosk Browser" /XML "scripts\alara-kiosk-browser.xml" /F
schtasks /Create /TN "ALARA Screens Off"   /XML "scripts\alara-screens-off.xml"   /F
schtasks /Create /TN "ALARA Screens On"    /XML "scripts\alara-screens-on.xml"    /F
```

Then, **as administrator**, run the power setup once:
```bash
scripts\kiosk-power-setup.cmd
```
It sets: never sleep/hibernate (AC + battery), and **lid-close = do nothing**
(internal panel goes dark, external monitor stays on).

Also make sure:
- The kiosk user **auto-logs in** (`netplwiz` → uncheck "Users must enter a
  user name and password"), so the tasks fire on every restart with no keypress.
- The **external monitor is the primary display** (or the lid is closed so it's
  the only active screen) — the fullscreen browser opens on the active display.

---

## Display schedule (screens off 2 PM, on 6 AM)

The screens turn **off at 2:00 PM** and **back on at 6:00 AM** every day, via the
**ALARA Screens Off** / **ALARA Screens On** tasks. The board server keeps
running the whole time — only the physical displays sleep.

Because the kiosk never sleeps and the display has no idle timeout, the only
thing that blanks the screen is the Off task. So **Screens Off repeats every 15
minutes from 2 PM until 6 AM** — if anything wakes the display overnight (a wake
timer, Windows Update, Automatic Maintenance), it gets re-blanked within ~15 min
instead of staying on until the next afternoon. To also stop the wake at its
source, disable wake timers and maintenance wake (run in an **admin** terminal):

```bash
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP BD3B718A-0680-4D9D-8AB2-E1D2B4AC806D 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP BD3B718A-0680-4D9D-8AB2-E1D2B4AC806D 0
powercfg /setactive SCHEME_CURRENT
reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\Maintenance" /v WakeUp /t REG_DWORD /d 0 /f
```

**Test right now:**
```bash
schtasks /Run /TN "ALARA Screens On"
:: (careful — this blanks the screen until you move the mouse:)
schtasks /Run /TN "ALARA Screens Off"
```
The screens wake on any mouse/keyboard input, so after testing "off," just move
the mouse.

**Change the times:** edit the `<StartBoundary>` time in
`scripts\alara-screens-off.xml` / `scripts\alara-screens-on.xml` (the date part
doesn't matter, only the `HH:MM:SS`), then re-import that task with
`schtasks /Create /TN "..." /XML "..." /F`. Or change the **Triggers** time in
Task Scheduler directly.

**Turn the schedule off:** disable or delete the two tasks:
```bash
schtasks /Change /TN "ALARA Screens Off" /DISABLE
schtasks /Change /TN "ALARA Screens On"  /DISABLE
```

> Note: because a mouse bump wakes the displays, if someone uses the machine
> after 2 PM the screens come back on. On an unattended kiosk nothing generates
> input, so they stay off until 6 AM.

> **Important — the machine must never lock.** A monitor blanked this way only
> wakes on input delivered to the *active* desktop. If the machine locks
> overnight, the active desktop becomes the secure lock screen and the 6 AM wake
> task can't reach it, so the screens stay dark. Disable the screensaver and the
> auto-lock so the session stays unlocked (run once; the `HKLM` one needs an
> **admin** terminal):
>
> ```bash
> reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 0 /f
> reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v InactivityTimeoutSecs /t REG_DWORD /d 0 /f
> ```

---

## Troubleshooting

**Board shows old data / stale banner.**
The pull may have been missed while the PC was off. Run it now:
`schtasks /Run /TN "ALARA Daily Pull"`. The board self-refreshes every 10 min;
press **Ctrl+R** to see it immediately. (Data lives in `public\today.json`.)

**Board is blank / "This site can't be reached".**
The server is down. Check with the port command above; restart the server task.
Check `serve-kiosk.log` for repeated "server exited" lines (a crash loop) — if
so, run `npm.cmd install` in the project folder, then restart.

**Screens don't wake at 6 AM and the PC seems asleep (you have to wake it).**
This laptop uses **Modern Standby** (S0 Low Power Idle) — check with `powercfg /a`.
On such machines, turning the display off pushes the PC into connected standby
even with "never sleep" set, and the 6 AM wake task then can't run until someone
wakes the machine. Fix: disable Modern Standby (needs an **admin** terminal, then
a **reboot**):

```bash
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Power" /v PlatformAoAcOverride /t REG_DWORD /d 0 /f
```

After rebooting, `powercfg /a` should no longer list "Standby (S0 Low Power
Idle)"; the machine then won't sleep and the schedule runs on time. Reverse with
`reg delete "...\Power" /v PlatformAoAcOverride /f`.

**Screens don't wake at 6 AM (stay dark until someone moves the mouse).**
The machine locked overnight, so the wake task's injected input couldn't reach
the secure lock-screen desktop. Fix: keep the session from locking — disable the
screensaver and set the inactivity auto-lock to "never" (see the two `reg`
commands under **Display schedule** above). The wake script also nudges the
display via a power request and a mouse jiggle, but an unlocked session is what
guarantees it. To test a wake right now: `schtasks /Run /TN "ALARA Screens On"`.

**Weather says "unavailable".**
Weather is a live browser call to Open-Meteo; it needs internet. It retries
every 10 minutes on its own.

**Laptop went to sleep with the lid closed.**
Re-run `scripts\kiosk-power-setup.cmd` **as administrator**. If a vendor power
app (Lenovo Vantage, Dell Power Manager, etc.) is installed, make sure it isn't
overriding the lid/sleep settings.

**Cursor won't hide.**
The board hides the mouse cursor entirely; it only reappears inside the settings
drawer (press `S`) so you can click. If you still see a cursor on the board face,
make sure the browser window is focused and on the board tab.

**Start fresh / wipe the counter.**
Board state (streak, record, custom lines) lives in the browser's
`localStorage`. Press `S` on the board for settings, or clear site data for
`localhost:5173` in the browser.

---

## Removing everything

```bash
schtasks /Delete /TN "ALARA Kiosk Server"  /F
schtasks /Delete /TN "ALARA Daily Pull"    /F
schtasks /Delete /TN "ALARA Kiosk Browser" /F
schtasks /Delete /TN "ALARA Screens Off"   /F
schtasks /Delete /TN "ALARA Screens On"    /F
```
Power settings can be reverted in **Settings → System → Power** (or by choosing
a different power plan).
