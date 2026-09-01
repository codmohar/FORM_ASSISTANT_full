@echo off
title Saral Setu - Docker Application Launcher
echo =========================================================================
echo  SARAL SETU - Multi-Language AI Form Assistant & Citizen Identity Vault
echo =========================================================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running or not installed.
    echo Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Building and starting Docker containers (App, MongoDB, Admin UI)...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo.
echo =========================================================================
echo  SUCCESS: Saral Setu is running in Docker!
echo =========================================================================
echo  - Web Application:       http://localhost:8000
echo  - Database Health:       http://localhost:8000/api/health/vault
echo  - DB Admin Dashboard:    http://localhost:8081  (User: admin / Pass: admin)
echo  - API Swagger Docs:      http://localhost:8000/docs
echo =========================================================================
echo.

:: Open browser automatically
start http://localhost:8000

echo Press any key to view live Docker container logs (or close window)...
pause >nul
docker compose logs -f app
