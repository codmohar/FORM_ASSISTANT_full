@echo off
title Saral Setu - Stop Docker Containers
echo =========================================================================
echo  Stopping Saral Setu Docker Containers...
echo =========================================================================
echo.

docker compose down

echo.
echo All Saral Setu containers have stopped safely.
echo.
pause
