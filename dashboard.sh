#!/bin/bash

# Simple Dashboard Viewer
# Fetches data from the local API

echo "=================================================="
echo "   MOMENTUM SNIPER - API DASHBOARD"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
NC='\033[0m'

# Check Health
HEALTH=$(curl -s --max-time 2 http://localhost:3000/health)
METRICS=$(curl -s --max-time 2 http://localhost:3000/metrics)

if [ -z "$HEALTH" ]; then
    echo "❌ API OFFLINE (Check Container)"
else
    echo -e "${GREEN}✅ API ONLINE${NC}"
    echo ""
    echo "Health: $HEALTH"
    echo "Metrics: $METRICS"
fi

echo ""
echo "=================================================="
echo "View full dashboard at: http://<VPS_IP>:3000/dashboard"
echo ""
