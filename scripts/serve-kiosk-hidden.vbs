' ===========================================================================
' A.L.A.R.A Safety Board - hidden launcher for the kiosk server.
' Runs serve-kiosk.cmd with NO visible window, so the server console can't be
' accidentally closed or Ctrl+C'd. Task Scheduler runs this via wscript.exe at
' logon. The second arg to .Run: 0 = hidden window; True = wait (the keep-alive
' loop in the .cmd never returns, so the task stays Running while the server is
' up, and Task Scheduler's IgnoreNew prevents duplicate servers).
' ===========================================================================
Dim shell, here
Set shell = CreateObject("WScript.Shell")
here = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
shell.Run """" & here & "serve-kiosk.cmd""", 0, True
