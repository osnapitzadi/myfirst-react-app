# Wake ALL connected displays. Asking the monitor to power on isn't reliable on
# its own once it's asleep, so we also inject a harmless keypress (F15, which
# does nothing visible) to force the wake.
Add-Type -Namespace Win -Name Wake -MemberDefinition @'
[DllImport("user32.dll")]
public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
[DllImport("user32.dll")]
public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);
'@

$HWND_BROADCAST  = [IntPtr]0xFFFF
$WM_SYSCOMMAND   = 0x0112
$SC_MONITORPOWER = 0xF170
$MONITOR_ON      = -1

# Ask the displays to power on...
[Win.Wake]::SendMessage($HWND_BROADCAST, $WM_SYSCOMMAND, [IntPtr]$SC_MONITORPOWER, [IntPtr]$MONITOR_ON) | Out-Null

# ...then nudge input (press + release F15) to actually wake them.
$VK_F15   = 0x7E
$KEYUP    = 0x2
[Win.Wake]::keybd_event($VK_F15, 0, 0,      [IntPtr]::Zero)
Start-Sleep -Milliseconds 50
[Win.Wake]::keybd_event($VK_F15, 0, $KEYUP, [IntPtr]::Zero)
