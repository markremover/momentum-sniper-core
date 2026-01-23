#!/bin/bash
# Momentum Sniper Update Script (Docker Version)

echo "⬇️ Pulling latest code from GitHub..."
git pull origin main

echo "🏗️ Rebuilding Momentum Scanner Container..."
# Rebuilds the image and restarts the container in detached mode
docker-compose up -d --build scanner

echo "🧹 Cleaning up old images..."
docker image prune -f

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "⏳ Waiting 10 seconds to verify stability..."
sleep 10

# Check if scanner is running
if [ "$(docker inspect -f '{{.State.Running}}' momentum-scanner 2>/dev/null)" = "true" ]; then
    echo -e "${GREEN}"
    echo "======================================================="
    echo "   🚀  MOMENTUM SNIPER IS ONLINE & STABLE  🚀"
    echo "======================================================="
    echo -e "${NC}"
    echo -e "${CYAN}Monitor logs with: sudo docker-compose logs -f scanner${NC}"
else
    echo -e "${RED}"
    echo "======================================================="
    echo "   ⚠️  CRITICAL ERROR: BOT CRASHED ON STARTUP  ⚠️"
    echo "======================================================="
    echo "Possible causes: Memory (OOM) or Config Error."
    echo "Checking logs for you:"
    echo -e "${NC}"
    docker logs --tail 20 momentum-scanner
fi
