@echo off
title MOMENTUM SNIPER - BLACK TERMINAL
color 0A
echo ===================================================
echo    PROJECT MOMENTUM SNIPER - LOCAL LAUNCHER
echo ===================================================
echo.
echo [1] Initializing Environment...
cd /d "%~dp0"

echo [2] install dependencies (if missing)...
call npm install

echo [3] Starting Scanner...
echo.
call npm run dev

pause
