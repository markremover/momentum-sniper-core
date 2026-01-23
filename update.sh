#!/bin/bash
# Momentum Sniper Update Script (Docker Version)

echo "⬇️ Pulling latest code from GitHub..."
git pull origin main

echo "🏗️ Rebuilding Momentum Scanner Container..."
# Rebuilds the image and restarts the container in detached mode
docker-compose up -d --build scanner

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Update Complete! Monitor logs with: docker logs -f momentum-scanner"
