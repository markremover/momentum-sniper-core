#!/bin/bash
# RESCUE SCRIPT - Fixes "KeyError" and N8N Instability

echo "=================================================="
echo "   MOMENTUM SNIPER - EMERGENCY REPAIR"
echo "=================================================="

# 1. Kill the specific ghost container causing KeyError
# (Trying to catch all potential zombies)
echo "[1/4] Hunting zombie containers..."
docker ps -a | grep "momentum-scanner" | awk '{print $1}' | xargs -r docker rm -f
docker ps -a | grep "momentum-brain" | awk '{print $1}' | xargs -r docker rm -f

# 2. Prune networks to fix connectivity
echo "[2/4] Refreshing Network..."
docker network prune -f

# 3. Restart Stack with more timeout
echo "[3/4] Restarting Stack..."
# Set timeout to avoid startup crashes on slow VM
export COMPOSE_HTTP_TIMEOUT=120
docker-compose up -d --remove-orphans

# 4. Check Status
echo "[4/4] Checking Health..."
sleep 5
docker ps
echo ""
echo "=================================================="
echo "Check Dashboard now: http://35.223.93.16:3001/dashboard"
echo "Check N8N now: http://35.223.93.16:5678/"
echo "=================================================="
