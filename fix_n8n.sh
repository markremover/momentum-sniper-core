#!/bin/bash

# Fix N8N Manual Start Script
# Defines network, cleans old container, starts new one matching docker-compose config

echo "🔍 Detecting Docker Network..."
NETWORK=$(docker network ls | grep "momentum-sniper" | awk '{print $2}' | head -1)

if [ -z "$NETWORK" ]; then
    echo "⚠️ Network not found! Falling back to 'bridge' (Scanner might not connect)"
    NETWORK="bridge"
else
    echo "✅ Found Network: $NETWORK"
fi

echo "🧹 Cleaning old N8N container..."
docker rm -f momentum-brain

echo "🚀 Starting N8N Manually..."
docker run -d \
  --name momentum-brain \
  --restart always \
  --network $NETWORK \
  -p 5678:5678 \
  --env-file .env \
  -e N8N_HOST=0.0.0.0 \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e NODE_ENV=production \
  -e WEBHOOK_URL=http://35.223.93.16:5678/ \
  -e GENERIC_TIMEZONE=America/New_York \
  -e N8N_SECURE_COOKIE=false \
  -v "$(pwd)/n8n_data:/home/node/.n8n" \
  n8nio/n8n:latest

echo "✅ N8N Started!"
echo "⏳ Waiting 10s for startup..."
sleep 10

echo "🔍 Checking status..."
docker ps | grep momentum-brain

if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "🟢 HEALTH CHECK PASSED! N8N is Online."
else
    echo "🔴 HEALTH CHECK FAILED. Check logs: docker logs momentum-brain"
fi
