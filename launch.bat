@echo off
setlocal EnableExtensions
REM Zombobs — one-click local server launcher (wraps launch.ps1)
cd /d "%~dp0"

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo [-] PowerShell not found. Install Windows PowerShell or PowerShell 7+.
    pause
    exit /b 1
)

REM Forward optional args: launch.bat -Port 3001 -NoBrowser -KillPort
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1" %*
set "EXITCODE=%ERRORLEVEL%"

if not "%EXITCODE%"=="0" (
    echo.
    echo [-] Server startup failed ^(exit %EXITCODE%^). Check messages above.
    pause
)

endlocal & exit /b %EXITCODE%
