@echo off
REM ===========================================================================
REM A.L.A.R.A Safety Board — kiosk power setup.
REM RUN THIS ONCE, AS ADMINISTRATOR (right-click > Run as administrator).
REM It configures the laptop so the board display stays up 24/7:
REM   - never turn the screen off, never sleep, never hibernate (AC and battery)
REM   - closing the lid does NOTHING (keeps running; internal panel goes dark
REM     because the lid is shut, external monitor stays on)
REM ===========================================================================

echo Setting timeouts to never (0 = never)...
REM Screen (monitor) never turns off:
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
REM Never sleep:
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
REM Never hibernate on idle:
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0

echo Setting lid-close action to "Do nothing" (plugged in and on battery)...
REM SUB_BUTTONS / LIDACTION: 0=Do nothing, 1=Sleep, 2=Hibernate, 3=Shut down
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT

echo Disabling hibernate entirely (also turns off fast startup)...
powercfg /hibernate off

echo.
echo Done. Current sleep/lid settings:
powercfg /query SCHEME_CURRENT SUB_BUTTONS LIDACTION
echo.
echo If you have a laptop-maker power app (Lenovo Vantage, Dell Power Manager,
echo etc.), make sure it isn't overriding these.
pause
