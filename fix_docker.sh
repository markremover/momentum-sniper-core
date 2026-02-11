#!/bin/bash
# FIX DOCKER CONFIG ERROR
# This script removes the specific images that cause older docker-compose to crash

echo "🛑 Stopping services..."
docker-compose down

echo "🧹 Removing Scanner Images (Fixing KeyError)..."
# Try all potential names for the image
docker rmi momentum-sniper_scanner
docker rmi momentum-sniper-scanner
docker rmi momentum-scanner

# Prune intermediate build caches that might be corrupt
docker image prune -f

echo "🏗️ Rebuilding Scanner safely..."
# Force recreation
docker-compose up -d --build scanner

echo "✅ Checking Status..."
sleep 5
docker ps | grep scanner
docker logs --tail 20 momentum-scanner
