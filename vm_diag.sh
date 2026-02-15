#!/bin/bash
# VM DIAGNOSTIC SCRIPT for Momentum Sniper
# Run this to see what's happening on your server

echo "=================================================="
echo "   VM DIAGNOSTICS - MOMENTUM SNIPER"
echo "=================================================="

echo ""
echo "[1] DISK FLUSH (Space Check)"
df -h | grep -E '^/dev/root|^/dev/sda1' || echo "Checking all mounts..." && df -h

echo ""
echo "[2] DOCKER PROCESSES (What is running?)"
docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "[3] NETWORK PORTS (Who is listening?)"
netstat -tuln | grep -E '3000|3001|5678' || echo "No active listeners on 3000/3001/5678"

echo ""
echo "[4] FOLDER STRUCTURE"
ls -la ~/momentum-sniper 2>/dev/null || echo "Folder ~/momentum-sniper NOT FOUND"

echo ""
echo "[5] GIT STATUS"
if [ -d "$HOME/momentum-sniper/.git" ]; then
    cd ~/momentum-sniper
    git status
else
    echo "NOT A GIT REPOSITORY"
fi

echo ""
echo "=================================================="
echo "Diagnostics Complete."
