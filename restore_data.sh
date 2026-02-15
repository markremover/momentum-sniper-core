#!/bin/bash
# DATA RESTORATION SCRIPT
# Finds the latest backup and restores N8N + Scanner Data

echo "=================================================="
echo "   MOMENTUM SNIPER - DATA RESTORE"
echo "=================================================="

# 1. FIND LATEST BACKUP
# Sorts by time, takes the last one
LATEST_BACKUP=$(ls -td ~/momentum_backup_* | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ ERROR: No backup folders found in ~/"
    echo "Please check manually with: ls ~/"
    exit 1
fi

echo "✅ Found Backup: $LATEST_BACKUP"
echo "   Contains: $(ls $LATEST_BACKUP)"

# 2. STOP SERVICES (To safely overwrite)
echo "[1/4] Stopping Services..."
docker-compose down

# 3. RESTORE DATA
echo "[2/4] Restoring Data..."

# Restore N8N Data
if [ -d "$LATEST_BACKUP/n8n_data" ]; then
    echo "   -> Restoring n8n_data..."
    rm -rf n8n_data
    cp -r "$LATEST_BACKUP/n8n_data" .
    
    # FIX PERMISSIONS (CRITICAL)
    echo "   -> Fixing N8N Permissions..."
    chown -R 1000:1000 n8n_data
    chmod -R 777 n8n_data
else
    echo "⚠️ WARNING: n8n_data not found in backup!"
fi

# Restore Scanner Data
if [ -d "$LATEST_BACKUP/data" ]; then
    echo "   -> Restoring scanner data..."
    rm -rf data
    cp -r "$LATEST_BACKUP/data" .
else
    echo "⚠️ WARNING: scanner data not found in backup!"
fi

# Restore .env (Just in case)
if [ -f "$LATEST_BACKUP/.env" ]; then
    echo "   -> Restoring .env..."
    cp "$LATEST_BACKUP/.env" .
fi

# 4. RESTART
echo "[3/4] Restarting..."
docker-compose up -d --build

echo "=================================================="
echo "✅ RESTORE COMPLETE"
echo "1. Refresh N8N (Log in with your OLD credentials)"
echo "2. Refresh Dashboard"
echo "=================================================="
