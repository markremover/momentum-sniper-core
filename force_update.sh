#!/bin/bash
# FORCE UPDATE SCRIPT V23.5

echo "🛑 STOPPING Old Scanner..."
docker stop momentum-scanner
docker rm momentum-scanner

echo "⬇️ PULLING Latest Code..."
git pull

echo "🏗️ REBUILDING Scanner (No Cache)..."
docker-compose build --no-cache scanner

echo "🚀 STARTING New Scanner..."
docker-compose up -d scanner

echo "✅ DONE! Waiting for startup..."
sleep 5
docker logs momentum-scanner | grep "Starting Momentum Sniper"
