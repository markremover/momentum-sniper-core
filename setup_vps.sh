#!/bin/bash
set -e

# Momentum Sniper - VPS Setup Script
# Usage: ./setup_vps.sh

echo "=========================================="
echo "   MOMENTUM SNIPER - INFRA SETUP"
echo "=========================================="

# 1. Update System
echo "[1/5] Updating System..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw

# 2. Install Docker & Docker Compose
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed."
else
    echo "Docker already installed."
fi

# 3. Setup Firewall
echo "[3/5] Configuring Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 5678/tcp # n8n UI
# sudo ufw enable -y # Interactive, better to let user enable it or assume enabled

# 4. Project Setup
echo "[4/5] Setting up Project Directory..."
mkdir -p ~/momentum-sniper
# In a real scenario, we would git clone here. 
# For now, we assume files are uploaded via SCP/SFTP to this directory.

# 5. Instructions
echo "=========================================="
echo "SETUP COMPLETE!"
echo "Please upload your project files (src, package.json, docker-compose.yml, .env) to ~/momentum-sniper"
echo "Then run: cd ~/momentum-sniper && docker compose up -d"
echo "Access n8n at http://<VPS_IP>:5678"
echo "=========================================="
