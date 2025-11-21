@echo off
REM Launch Zombobs Server via PowerShell wrapper
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0launch.ps1"
if errorlevel 1 (
    echo.
    echo Server startup failed. Check the error messages above.
    pause
)
