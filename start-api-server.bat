@echo off
cd /d "%~dp0"
echo Starting API Server...
echo.
call node_modules\.bin\tsx src/server.ts
pause
