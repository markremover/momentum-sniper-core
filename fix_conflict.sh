#!/bin/bash
# FIX CONFLICT SCRIPT
# Bypasses docker-compose to force kill conflicting containers

echo "🔪 KILLING Zombie Containers..."
# Force remove containers by name (ignore if not found)
docker rm -f momentum-brain
docker rm -f momentum-scanner

echo "🧹 Cleaning up Network..."
docker network prune -f

echo "🧹 Removing Conflicting Images..."
docker rmi -f momentum-sniper-scanner
docker rmi -f momentum-sniper_scanner

echo "🏗️ FRESH START (Rebuilding Everything)..."
# Now use docker-compose to build fresh
docker-compose up -d --build

echo "✅ DONE! Waiting for startup..."
sleep 5
docker ps
