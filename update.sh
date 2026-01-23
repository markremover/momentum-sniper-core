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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "======================================================="
echo "   🚀  MOMENTUM SNIPER UPDATED & RESTARTED  🚀"
echo "======================================================="
echo -e "${NC}"
echo -e "${CYAN}Monitor logs with: sudo docker-compose logs -f scanner${NC}"
