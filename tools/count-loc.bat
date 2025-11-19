@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0count-loc.ps1"
pause

