#!/bin/bash
# FIX V31 FINAL: PERMISSIONS & UI

echo "=================================================="
echo "   V31.1 FINAL REPAIR"
echo "=================================================="

# 1. FIX FILE PERMISSIONS (The root cause of N8N crash)
# When we copied data back as root, N8N (user 'node') lost access.
echo "[1/3] Fixing Data Ownership..."
chown -R 1000:1000 n8n_data
chmod -R 777 n8n_data  # Bruteforce safety
echo "Ownership fixed."

# 2. UPDATE UI CODE MANUALLY (To skip cache/git issues)
echo "[2/3] Updating Dashboard UI..."
git pull origin main

# 3. RESTART STACK
echo "[3/3] Restarting Services..."
docker-compose down
docker-compose up -d --build

echo "=================================================="
echo "DONE! Wait 60s for N8N to boot."
echo "Check: http://35.223.93.16:3001/dashboard"
echo "=================================================="
