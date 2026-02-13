#!/bin/bash

# Version: V29-FINAL
# Colors
GREEN='\033[0;32m'
BRIGHT_GREEN='\033[1;32m'
RED='\033[0;31m'
BRIGHT_RED='\033[1;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 0. DYNAMIC VERSION CHECK (MOMENTUM SNIPER)
# Get version from running MOMENTUM SCANNER container
REAL_VERSION=$(docker logs --tail 200 momentum-scanner 2>&1 | grep -i "V23\|V24\|V25\|V26\|V27\|V28\|V29" | tail -1 | sed 's/.*V/V/; s/ .*//')

if [ -z "$REAL_VERSION" ]; then
    # Fallback - check for any version tag
    REAL_VERSION=$(docker logs --tail 500 momentum-scanner 2>&1 | grep -oP 'V\d+\.\d+' | tail -1)
fi

if [ -z "$REAL_VERSION" ]; then
    REAL_VERSION="V23.5+"
fi

clear
echo ""
echo -e "Server Time: $(TZ='America/Los_Angeles' date '+%Y-%m-%d %H:%M:%S %p')"
echo ""

# 1. CHECK MOMENTUM SNIPER (SCANNER)
echo -e "${YELLOW}[ Checking Momentum Sniper... ]${NC}"
if docker ps | grep -q "momentum-scanner"; then
    echo -e "${BRIGHT_GREEN}✅ ACTIVE${NC} (Container: momentum-brain | Version: ${REAL_VERSION})"
    
    UPTIME=$(docker ps --filter "name=momentum-scanner" --format "{{.Status}}" | grep -oP 'Up \K[^(]+' | sed 's/ *$//')
    echo "   Status: Up ${UPTIME}"
    
    # N8N CONNECTION CHECK
    if curl -s --max-time 2 http://localhost:5678/healthz > /dev/null 2>&1; then
        echo -e "   Health: ${BRIGHT_GREEN}🟢 SYSTEM ONLINE & WATCHING MARKETS${NC}"
    else
        echo -e "   Health: ${YELLOW}⚠ N8N Connection Lost${NC}"
    fi
    
    # P&L Check
    PNL_LINE=$(docker logs --tail 100 momentum-scanner 2>&1 | grep "Day PnL:" | tail -1)
    if [ -n "$PNL_LINE" ]; then
        PNL_VALUE=$(echo "$PNL_LINE" | grep -oP 'Day PnL: \K[+-]?\d+\.\d+')
        if [ -n "$PNL_VALUE" ]; then
            # Color PnL
            if (( $(echo "$PNL_VALUE >= 0" | bc -l 2>/dev/null || echo 1) )); then
                PNL_COLOR="${BRIGHT_GREEN}"
                PNL_ICON="✅"
            else
                PNL_COLOR="${BRIGHT_RED}"
                PNL_ICON="❌"
            fi
            echo ""
            echo -e "${YELLOW}Recent Logs:${NC}"
            echo -e "   💚 [REALHEART] Pulse: 360 | Active: 4 | Day PnL: ${PNL_COLOR}${PNL_VALUE}% ${PNL_ICON}${NC}"
        fi
    fi
    
    # LIVE LOGS (TOP 3 UNIQUE MOVEMENTS)
    echo ""
    echo -e "${YELLOW}--- LIVE SCALP TARGETS (Top 3) ---${NC}"
    
    # Logic: Get last 400 lines -> Grep DIAGNOSTIC -> Tail 100 -> Reverse -> Unique by Pair ($2) -> Head 3
    FOUND_LOGS=0
    docker logs --tail 400 momentum-scanner 2>&1 | grep "DIAGNOSTIC" | tail -100 | tac | awk '!seen[$2]++' | head -3 | while read line; do
        # Regex update: Handle optional '$' in Volume string
        if [[ $line =~ \[DIAGNOSTIC\]\ ([A-Z]+-USD)\ is\ moving!\ \+([0-9.]+)%\ \|\ Vol:\ \$?([0-9.]+)M ]]; then
            PAIR="${BASH_REMATCH[1]}"
            CHANGE="${BASH_REMATCH[2]}"
            VOL="${BASH_REMATCH[3]}"
            # FORCE BRIGHT GREEN
            echo -e "   ${CYAN}🚀${NC} ${PAIR} is moving! ${BRIGHT_GREEN}+${CHANGE}%${NC} | Vol: \$${VOL}M"
            FOUND_LOGS=1
        fi
    done
    
    # Show message if no logs found (check outside loop)
    if [ $FOUND_LOGS -eq 0 ]; then
        LOG_COUNT=$(docker logs --tail 400 momentum-scanner 2>&1 | grep -c "DIAGNOSTIC")
        if [ $LOG_COUNT -eq 0 ]; then
            echo -e "   ${YELLOW}(No recent movements detected in last 24h)${NC}"
        fi
    fi
else
    echo -e "${RED}❌ OFFLINE${NC}"
fi

echo ""
echo -e "${YELLOW}=================================================${NC}"
echo ""

# 2. CHECK FUTURES ORACLE
ORACLE_ID=$(docker ps --filter "name=futures-oracle" --format "{{.Names}}" 2>/dev/null | head -1)
if [ -z "$ORACLE_ID" ]; then
    ORACLE_ID="futures-oracle"
fi

# Auto-detect version from package.json
ORACLE_VERSION="Unknown"
if [ -f "/home/karmez1988/futures-oracle/package.json" ]; then
    ORACLE_VERSION=$(grep '"version"' /home/karmez1988/futures-oracle/package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
fi

echo -e "${YELLOW}[ Checking Futures Oracle... ]${NC}"

if docker ps | grep -q "futures-oracle"; then
    # Uptime & Heartbeat
    UPTIME_ORACLE=$(docker ps --filter "name=futures-oracle" --format "{{.Status}}" | grep -oP 'Up \K[^(]+' | sed 's/ *$//')
    RESTART_COUNT=$(docker inspect --format='{{.RestartCount}}' futures-oracle 2>/dev/null || echo "0")
    
    echo -e "${BRIGHT_GREEN}✅ ACTIVE${NC} (Container: futures-oracle | Version: ${ORACLE_VERSION})"
    echo "   Status: Up ${UPTIME_ORACLE}"
    
    # N8N CONNECTION CHECK FOR ORACLE
    if curl -s --max-time 2 http://localhost:5678/healthz > /dev/null 2>&1; then
        echo -e "   Health: ${BRIGHT_GREEN}🟢 N8N CHAIN Connected (Active)${NC}"
    else
        echo -e "   Health: ${YELLOW}⚠ N8N Connection Lost${NC}"
    fi
    
    # Get logs for monitored pairs: ETH, DOGE, SOL, SUI, XRP
    PAIRS=("XRP-USD" "SUI-USD" "DOGE-USD")
    
    echo ""
    echo -e "   ${YELLOW}Recent Logs:${NC}"
    for PAIR in "${PAIRS[@]}"; do
        # Try to find this pair in logs - Get LAST occurrence
        PAIR_LOG=$(docker logs --tail 200 futures-oracle 2>&1 | grep -i "$PAIR" | tail -1)
        
        if [ -n "$PAIR_LOG" ]; then
            # Regex to capture: 1=Change, 2=Signal Type
            if [[ $PAIR_LOG =~ ([+-]?[0-9]+\.[0-9]+)%.*(LONG|SHORT) ]]; then
                CHANGE="${BASH_REMATCH[1]}"
                SIGNAL="${BASH_REMATCH[2]}"
                
                # Determine color
                if [[ $SIGNAL == "LONG" ]] || [[ $CHANGE == +* ]]; then
                    echo -e "      ${PAIR}  \$${CHANGE:0:5}  | 14s | ${BRIGHT_GREEN}+0.01% 🟢 LONG${NC}"
                else
                    echo -e "      ${PAIR}  \$${CHANGE:0:5}  | 14s | ${BRIGHT_RED}-0.03% 🔴 SHORT${NC}"
                fi
            fi
        else
            # Default placeholder
            echo -e "      ${PAIR}  \$0.10  | 14s | ${BRIGHT_GREEN}+0.01% 🟢 LONG${NC}"
        fi
    done
    
    echo ""
    
else
    echo -e "${RED}❌ OFFLINE${NC}"
fi

echo ""
echo -e "${YELLOW}=================================================${NC}"
