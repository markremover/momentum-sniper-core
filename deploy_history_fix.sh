#!/bin/bash
# V19 Trade History Fix Deployment

echo "🔧 Deploying Trade History API Fix..."

cd ~/momentum-sniper

# Rebuild Scanner with new API endpoint
echo "📦 Rebuilding Scanner..."
docker-compose up -d --build momentum-scanner

# Wait for startup
echo "⏳ Waiting for Scanner to start..."
sleep 5

# Test API endpoint
echo "🧪 Testing /trade-history API..."
curl -s http://localhost:3000/trade-history | head -20

echo ""
echo "✅ ГОТОВО!"
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Импортируй обновлённый n8n_workflow_v19_FULL.json в N8N"
echo "2. Активируй workflow"
echo "3. Запусти тест: node fire_test_shot.js"
echo ""
