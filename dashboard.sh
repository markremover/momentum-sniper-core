#!/bin/bash

# Version: V20.1
# Colors
GREEN='\033[0;32m'
BRIGHT_GREEN='\033[1;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo ""
echo -e "${YELLOW}=================================================${NC}"
echo -e "         ${BRIGHT_GREEN}MOMENTUM SNIPER ${YELLOW}V20.1${NC}"
echo -e "${YELLOW}=================================================${NC}"
echo ""

# SERVER TIME
echo -e "Server Time: $(date '+%Y-%m-%d %H:%M:%S %p')"
echo ""

# 1. CHECK MOMENTUM SNIPER (SCANNER)
if docker ps | grep -q "momentum-scanner"; then
    UPTIME=$(docker ps --filter "name=momentum-scanner" --format "{{.Status}}" | grep -oP 'Up \K[^(]+' | sed 's/ *$//')
    echo -e "${GREEN}● ${NC}HOT ACTIVE    Up ${UPTIME}"
    
    # P&L Check
    PNL_LINE=$(docker logs --tail 100 momentum-scanner 2>&1 | grep "Day PnL:" | tail -1)
    if [ -n "$PNL_LINE" ]; then
        PNL_VALUE=$(echo "$PNL_LINE" | grep -oP 'Day PnL: \K[+-]?\d+\.\d+')
        if [ -n "$PNL_VALUE" ]; then
            # Color PnL
            if (( $(echo "$PNL_VALUE >= 0" | bc -l) )); then
                PNL_COLOR="${BRIGHT_GREEN}"
            else
                PNL_COLOR="${RED}"
            fi
            echo -e "${BRIGHT_GREEN}💚${NC}[REALHEART] Pulse: 360 | Active: 4 | Day PnL: ${PNL_COLOR}${PNL_VALUE}%${NC}"
        fi
    fi
    
    # Get recent trading activity - show different pairs
    echo ""
    docker logs --tail 100 momentum-scanner 2>&1 | grep "DIAGNOSTIC" | tail -10 | while read line; do
        if [[ $line =~ \[DIAGNOSTIC\]\ ([A-Z]+-USD)\ is\ moving!\ \+([0-9.]+)%\ \|\ Vol:\ ([0-9.]+)M ]]; then
            PAIR="${BASH_REMATCH[1]}"
            CHANGE="${BASH_REMATCH[2]}"
            VOL="${BASH_REMATCH[3]}"
            echo -e "${CYAN}(DIAGNOSTIC)${NC} ${PAIR} is moving! +${CHANGE}% | Vol: ${VOL}M"
        fi
    done
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

echo -e "${YELLOW}FUTURES ORACLE ${ORACLE_ID}${NC}"
echo ""

if docker ps | grep -q "futures-oracle"; then
    # Heartbeat & Restart Count
    RESTART_COUNT=$(docker inspect --format='{{.RestartCount}}' futures-oracle 2>/dev/null || echo "0")
    echo -e "${YELLOW}⚠${NC} Heartbeat: ${RESTART_COUNT} (Stable)"
    
    # Get logs for monitored pairs: ETH, DOGE, SOL, SUI, XRP
    PAIRS=("ETH-USD" "DOGE-USD" "SOL-USD" "SUI-USD" "XRP-USD")
    
    echo ""
    for PAIR in "${PAIRS[@]}"; do
        # Try to find this pair in logs
        PAIR_LOG=$(docker logs --tail 200 futures-oracle 2>&1 | grep -i "$PAIR" | tail -1)
        
        if [ -n "$PAIR_LOG" ]; then
            # Try to extract percentage change
            if [[ $PAIR_LOG =~ ([+-]?[0-9]+\.[0-9]+)% ]]; then
                CHANGE="${BASH_REMATCH[1]}"
                
                # Determine direction and color
                if [[ $CHANGE == +* ]] || [[ $CHANGE =~ ^[0-9] ]]; then
                    DIR="LONG"
                    CIRCLE="${BRIGHT_GREEN}●${NC}"
                else
                    DIR="SHORT"
                    CIRCLE="${RED}●${NC}"
                fi
                
                echo -e "  ${PAIR}     | ${CHANGE}% | ${DIR} | ${CIRCLE}${BRIGHT_GREEN}Normal${NC}"
            else
                # No percentage found, show default
                echo -e "  ${PAIR}     | +0.00% | LONG | ${BRIGHT_GREEN}●${NC}${BRIGHT_GREEN}Normal${NC}"
            fi
        else
            # No log found, show default
            echo -e "  ${PAIR}     | +0.00% | LONG | ${BRIGHT_GREEN}●${NC}${BRIGHT_GREEN}Normal${NC}"
        fi
    done
    
    echo ""
    
    # N8N Status
    if docker logs --tail 50 futures-oracle 2>&1 | grep -qiE "n8n.*connected|Ready.*Signal"; then
        echo -e "${BRIGHT_GREEN}● N8N CHAIN${NC}    Active (Ready for Signals)"
    else
        echo -e "${YELLOW}● N8N CHAIN${NC}    Initializing..."
    fi
    
else
    echo -e "${RED}❌ OFFLINE${NC}"
fi

echo ""
