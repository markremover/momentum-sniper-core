#!/bin/bash
# CLEAN INSTALL SCRIPT
# WARNING: This resets the Momentum Sniper folder but KEEPS your data.

echo "=================================================="
echo "   MOMENTUM SNIPER - CLEAN INSTALL PROTOCOL"
echo "=================================================="
cd ~

# 1. STOP EVERYTHING
echo "[1/6] Stopping Docker Containers..."
if [ -d "momentum-sniper" ]; then
    cd momentum-sniper
    docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || echo "Docker already stopped or compose file missing."
    cd ~
fi
# Force kill any stragglers
docker rm -f momentum-scanner momentum-brain 2>/dev/null

# 2. BACKUP DATA
echo "[2/6] Backing up Data..."
BACKUP_NAME="momentum_backup_$(date +%s)"
mkdir -p $BACKUP_NAME
if [ -d "momentum-sniper" ]; then
    cp momentum-sniper/.env $BACKUP_NAME/ 2>/dev/null
    cp -r momentum-sniper/data $BACKUP_NAME/ 2>/dev/null
    cp -r momentum-sniper/n8n_data $BACKUP_NAME/ 2>/dev/null
    echo "Backup saved to: ~/$BACKUP_NAME"
else
    echo "No existing folder to backup. Proceeding."
fi

# 3. NUKE OLD FOLDER
echo "[3/6] Removing corrupted folder..."
rm -rf momentum-sniper

# 4. CLONE FRESH REPO
echo "[4/6] Cloning Fresh Repository..."
git clone https://github.com/markremover/momentum-sniper-core.git momentum-sniper
if [ ! -d "momentum-sniper" ]; then
    echo "❌ Git Clone FAILED. Check internet connection or GitHub status."
    exit 1
fi

# 5. RESTORE DATA
echo "[5/6] Restoring Data..."
if [ -f "$BACKUP_NAME/.env" ]; then
    cp $BACKUP_NAME/.env momentum-sniper/
    cp -r $BACKUP_NAME/data momentum-sniper/
    cp -r $BACKUP_NAME/n8n_data momentum-sniper/
    echo "Data restored successfully."
else
    echo "⚠️ No backup found to restore. You may need to create .env manually."
fi

# 6. LAUNCH
echo "[6/6] Launching System..."
cd momentum-sniper
docker-compose up -d --build

echo ""
echo "=================================================="
echo "✅ INSTALLATION COMPLETE"
echo "Check dashboard: ./dashboard.sh"
echo "Web Dashboard: http://<VPS_IP>:3001/dashboard"
echo "=================================================="
