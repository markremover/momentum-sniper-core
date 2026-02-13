#!/bin/bash

# Fix Menu Alias Script
# This script updates the 'menu' command to use the new dashboard.sh

echo "🔧 Fixing 'menu' command alias..."

# Remove old alias if exists
sed -i '/alias menu=/d' ~/.bashrc
sed -i '/alias menu=/d' ~/.bash_aliases 2>/dev/null

# Add new alias pointing to correct dashboard.sh
echo "" >> ~/.bashrc
echo "# Momentum Sniper Dashboard (Updated)" >> ~/.bashrc
echo "alias menu='cd /home/karmez1988/momentum-sniper && ./dashboard.sh'" >> ~/.bashrc

# Reload bashrc
source ~/.bashrc

echo "✅ Done! Now 'menu' will use the new dashboard.sh"
echo ""
echo "Test it: type 'menu' in terminal"
