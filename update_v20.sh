#!/bin/bash

# MOMENTUM SNIPER V20 UPDATE SCRIPT
# This script updates the bot code and prepares N8N for the V20 News Workflow.

echo "==================================================="
echo "   🚀 MOMENTUM SNIPER V20 UPDATE MANAGER 🚀"
echo "==================================================="
echo ""

# 1. Pull Latest Code
echo "[1/3] Pulling latest V20 code from GitHub..."
git reset --hard origin/main
git pull origin main
echo "✅ Code updated."
echo ""

# 2. Update Configuration
echo "[2/3] Updating build version..."
# Ensure package.json matches
if grep -q "20.0.0" package.json; then
    echo "✅ Version 20.0.0 detected."
else
    echo "⚠️  Version mismatch? Attempting to fix..."
    sed -i 's/"version": "19.1.0"/"version": "20.0.0"/' package.json
fi
echo ""

# 3. N8N Workflow Instructions
echo "[3/3] N8N V20 Workflow Import"
echo "⚠️  CRITICAL: You must manually import the new workflow if not done!"
echo "    File: n8n_workflow_v20_NEWS.json"
echo ""
echo "    Copy this file content and import into N8N UI:"
echo "    cat n8n_workflow_v20_NEWS.json"
echo ""

# 4. Rebuild & Restart
echo "==================================================="
echo "   🔄 RESTARTING SERVICES..."
echo "==================================================="
docker-compose down
docker-compose up -d --build

echo ""
echo "✅ UPDATE COMPLETE! V20 is now live."
echo "   Monitor logs: docker logs -f momentum-scanner"
echo "==================================================="
