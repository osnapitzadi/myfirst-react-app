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

Supporting files (in `scripts\`):

- `serve-kiosk.cmd` — the keep-alive loop that (re)launches the server
- `serve-kiosk-hidden.vbs` — runs the above with **no window**
- `pull-today.cmd` / `pull-today.mjs` — the daily data pull
- `launch-kiosk-browser.cmd` — opens the fullscreen browser
- `kiosk-power-setup.cmd` — one-time power/lid configuration
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

:: install the three tasks
schtasks /Create /TN "ALARA Kiosk Server"  /XML "scripts\alara-serve-kiosk.xml"  /F
schtasks /Create /TN "ALARA Daily Pull"    /XML "scripts\alara-pull-today.xml"    /F
schtasks /Create /TN "ALARA Kiosk Browser" /XML "scripts\alara-kiosk-browser.xml" /F
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

## Troubleshooting

**Board shows old data / stale banner.**
The pull may have been missed while the PC was off. Run it now:
`schtasks /Run /TN "ALARA Daily Pull"`. The board self-refreshes every 10 min;
press **Ctrl+R** to see it immediately. (Data lives in `public\today.json`.)

**Board is blank / "This site can't be reached".**
The server is down. Check with the port command above; restart the server task.
Check `serve-kiosk.log` for repeated "server exited" lines (a crash loop) — if
so, run `npm.cmd install` in the project folder, then restart.

**Weather says "unavailable".**
Weather is a live browser call to Open-Meteo; it needs internet. It retries
every 10 minutes on its own.

**Laptop went to sleep with the lid closed.**
Re-run `scripts\kiosk-power-setup.cmd` **as administrator**. If a vendor power
app (Lenovo Vantage, Dell Power Manager, etc.) is installed, make sure it isn't
overriding the lid/sleep settings.

**Cursor won't hide.**
It hides after 10 seconds of no mouse movement and returns on movement — this is
per-page, so the board must have focus.

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
```
Power settings can be reverted in **Settings → System → Power** (or by choosing
a different power plan).
