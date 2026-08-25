# Turn OFF all connected displays (monitor power save / backlight off).
# Broadcasts the Windows "monitor power" system command. Any real input
# (mouse/keyboard) will wake them again — on an unattended kiosk nothing does,
# so they stay off until the scheduled wake (or someone touches the machine).
Add-Type -Namespace Win -Name Mon -MemberDefinition @'
[DllImport("user32.dll")]
public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
'@

$HWND_BROADCAST  = [IntPtr]0xFFFF
$WM_SYSCOMMAND   = 0x0112
$SC_MONITORPOWER = 0xF170
$MONITOR_OFF     = 2

[Win.Mon]::SendMessage($HWND_BROADCAST, $WM_SYSCOMMAND, [IntPtr]$SC_MONITORPOWER, [IntPtr]$MONITOR_OFF) | Out-Null
