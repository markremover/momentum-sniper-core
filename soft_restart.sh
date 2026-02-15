#!/bin/bash
# Soft Restart - Apply Code Changes Without Full Rebuild

echo "🔄 Restarting Momentum Scanner (Soft Restart)..."
echo "   This will apply code changes from the last 'git pull'."
echo ""

docker-compose restart scanner

echo "✅ Restart Complete!"
echo "⏳ Waiting 10s for startup..."
sleep 10

echo ""
echo "📊 Checking for DIAGNOSTIC logs..."
docker logs --tail 50 momentum-scanner 2>&1 | grep "DIAGNOSTIC" || echo "   ⚠️  No movements yet (wait for coins to move >3%)"

echo ""
echo "🎯 Run ./dashboard.sh to see the menu with logs"
