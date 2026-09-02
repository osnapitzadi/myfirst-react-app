# Wake ALL connected displays. Asking the monitor to power on isn't reliable on
# its own once it's asleep, so we hit it from three angles:
#   1) SetThreadExecutionState(ES_DISPLAY_REQUIRED) - a power request that tells
#      Windows the display is needed (works regardless of lock state).
#   2) SC_MONITORPOWER = ON broadcast.
#   3) Injected input - a 1px mouse jiggle plus an F15 tap. A relative mouse move
#      is treated as wake input more reliably than a function key.
#
# NOTE: a monitor blanked with SC_MONITORPOWER only wakes on input delivered to
# the ACTIVE desktop. If the machine is LOCKED, the active desktop is the secure
# (lock-screen) desktop and this task's injected input can't reach it, so the
# wake fails. Keep the kiosk from locking (disable screensaver + set
# InactivityTimeoutSecs=0) so this always lands. See docs/KIOSK-MAINTENANCE.md.
Add-Type -Namespace Win -Name Wake -MemberDefinition @'
[DllImport("user32.dll")]
public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
[DllImport("user32.dll")]
public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, IntPtr dwExtraInfo);
[DllImport("user32.dll")]
public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);
[DllImport("kernel32.dll")]
public static extern uint SetThreadExecutionState(uint esFlags);
'@

# 1) Power request: mark the display as required (lock-independent nudge).
$ES_CONTINUOUS       = [uint32]0x80000000
$ES_DISPLAY_REQUIRED = [uint32]0x00000002
[Win.Wake]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_DISPLAY_REQUIRED) | Out-Null

# 2) Ask the displays to power on.
$HWND_BROADCAST  = [IntPtr]0xFFFF
$WM_SYSCOMMAND   = 0x0112
$SC_MONITORPOWER = 0xF170
$MONITOR_ON      = -1
[Win.Wake]::SendMessage($HWND_BROADCAST, $WM_SYSCOMMAND, [IntPtr]$SC_MONITORPOWER, [IntPtr]$MONITOR_ON) | Out-Null

# 3) Inject input to force the wake: tiny relative mouse jiggle (+1 then -1)...
$MOUSEEVENTF_MOVE = 0x0001
[Win.Wake]::mouse_event($MOUSEEVENTF_MOVE, 1, 0, 0, [IntPtr]::Zero)
Start-Sleep -Milliseconds 40
[Win.Wake]::mouse_event($MOUSEEVENTF_MOVE, [uint32]0xFFFFFFFF, 0, 0, [IntPtr]::Zero) # -1 relative

# ...then an F15 tap (does nothing visible) as a fallback.
$VK_F15 = 0x7E
$KEYUP  = 0x2
[Win.Wake]::keybd_event($VK_F15, 0, 0,     [IntPtr]::Zero)
Start-Sleep -Milliseconds 40
[Win.Wake]::keybd_event($VK_F15, 0, $KEYUP, [IntPtr]::Zero)

# 4) Drop the continuous flag (leave a one-shot display-required for this pass).
Start-Sleep -Milliseconds 200
[Win.Wake]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
