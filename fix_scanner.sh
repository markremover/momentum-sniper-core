#!/bin/bash

# Fix Scanner Manual Start Script (The "Nuclear Option")
# Bypasses broken docker-compose completely.

echo "🔍 Detecting Docker Network..."
NETWORK=$(docker network ls | grep "momentum-sniper" | awk '{print $2}' | head -1)

if [ -z "$NETWORK" ]; then
    echo "⚠️ Network not found! Using 'bridge' (Might not see N8N)"
    NETWORK="bridge"
else
    echo "✅ Found Network: $NETWORK"
fi

echo "🔨 Building Scanner Image (Fresh)..."
docker build -t momentum-scanner .

echo "🧹 Cleaning old Scanner container..."
docker rm -f momentum-scanner

echo "🚀 Starting Scanner Manually..."
# Matches docker-compose config exactly
docker run -d \
  --name momentum-scanner \
  --restart always \
  --network $NETWORK \
  -p 3000:3000 \
  --env-file .env \
  -e N8N_WEBHOOK_URL=http://momentum-brain:5678/webhook/momentum-trigger-new-v13 \
  -v "$(pwd)/data:/data" \
  --memory="800m" \
  --memory-reservation="400m" \
  momentum-scanner

echo "⏳ Waiting 10s for startup..."
sleep 10

echo "🔍 Checking status..."
if docker ps | grep -q "momentum-scanner"; then
    echo "🟢 SCANNER IS ONLINE!"
    echo "📜 Logs preview:"
    docker logs --tail 10 momentum-scanner
else
    echo "🔴 SCANNER FAILED TO START. Check logs: docker logs momentum-scanner"
fi
