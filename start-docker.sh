#!/usr/bin/env bash
# =========================================================================
# SARAL SETU - UNIX/LINUX/MACOS DOCKER LAUNCH SCRIPT
# =========================================================================

set -e

echo "========================================================================="
echo " SARAL SETU - Multi-Language AI Form Assistant & Citizen Identity Vault"
echo "========================================================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    exit 1
fi

echo "[1/3] Building and starting Docker containers..."
docker compose up -d --build

echo ""
echo "[2/3] Waiting for services to initialize..."
sleep 3

echo ""
echo "========================================================================="
echo " SUCCESS: Saral Setu is running in Docker!"
echo "========================================================================="
echo " - Web Application:       http://localhost:8000"
echo " - Database Health:       http://localhost:8000/api/health/vault"
echo " - DB Admin Dashboard:    http://localhost:8081 (User: admin / Pass: admin)"
echo " - API Swagger Docs:      http://localhost:8000/docs"
echo "========================================================================="
echo ""

# Try opening default browser on Linux/macOS
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000 &> /dev/null || true
elif command -v open &> /dev/null; then
    open http://localhost:8000 &> /dev/null || true
fi

echo "Streaming logs for 'app' (Press Ctrl+C to detach)..."
docker compose logs -f app
