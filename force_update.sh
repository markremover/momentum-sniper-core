#!/bin/bash

# FORCE UPDATE SCRIPT FOR VM
# This script forces a hard reset and pulls latest dashboard.sh

echo "🔄 Force updating dashboard from GitHub..."

cd /home/karmez1988/momentum-sniper

# Force reset to remote state
git fetch origin
git reset --hard origin/main

# Make executable
chmod +x dashboard.sh fix_menu_alias.sh

echo "✅ Dashboard updated! Run 'menu' to see changes."
