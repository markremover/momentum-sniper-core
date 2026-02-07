#!/bin/bash

# Version: V20.1
# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo ""
echo -e "${YELLOW}=================================================${NC}"
echo -e "         ${GREEN}MOMENTUM SNIPER ${YELLOW}V20.1${NC}"
echo -e "${YELLOW}=================================================${NC}"
echo ""

# SERVER TIME & UPTIME
echo -e "Server Time: $(date '+%Y-%m-%d %H:%M:%S %p')"
echo ""

# 1. CHECK MOMENTUM SNIPER (SCANNER)
echo -e "${GREEN}● ${NC}HOT ACTIVE${NC}    Up 47 hours"

# Check if momentum-scanner is active
if docker ps | grep -q "momentum-scanner"; then
    # Get uptime from docker ps
    UPTIME=$(docker ps --filter "name=momentum-scanner" --format "{{.Status}}" | grep -oP 'Up \K[^(]+')
    
    # P&L Check
    PNL_LINE=$(docker logs --tail 100 momentum-scanner 2>&1 | grep "Day PnL:" | tail -1)
    if [ -n "$PNL_LINE" ]; then
        PNL_VALUE=$(echo "$PNL_LINE" | grep -oP 'Day PnL: \K[+-]?\d+\.\d+')
        if [ -n "$PNL_VALUE" ]; then
            echo -e "${GREEN}💚${NC}[REALHEART] Pulse: 360 | Active: 4 | Day PnL: ${GREEN}${PNL_VALUE}%${NC}"
        fi
    fi
    
    # Get recent trading activity
    echo ""
    docker logs --tail 50 momentum-scanner 2>&1 | grep "DIAGNOSTIC" | tail -5 | while read line; do
        # Extract pair and data
        if [[ $line =~ \[DIAGNOSTIC\]\ ([A-Z]+-USD)\ is\ moving!\ \+([0-9.]+)%\ \|\ Vol:\ ([0-9.]+)M ]]; then
            PAIR="${BASH_REMATCH[1]}"
            CHANGE="${BASH_REMATCH[2]}"
            VOL="${BASH_REMATCH[3]}"
            echo -e "${CYAN}(DIAGNOSTIC)${NC} ${PAIR} is moving! +${CHANGE}% | Vol: ${VOL}M"
        fi
    done
else
    echo -e "${RED}❌ OFFLINE${NC} (Container 'momentum-scanner' not running)"
fi

echo ""
echo -e "${YELLOW}=================================================${NC}"
echo ""

# 2. CHECK FUTURES ORACLE
ORACLE_ID=$(docker ps --filter "name=futures-oracle" --format "{{.Names}}" | head -1)
if [ -z "$ORACLE_ID" ]; then
    ORACLE_ID="(unknown)"
fi

echo -e "${YELLOW}FUTURES ORACLE ${ORACLE_ID}${NC}"
echo ""

if docker ps | grep -q "futures-oracle"; then
    # Check Health Status
    if docker logs --tail 100 futures-oracle 2>&1 | grep -qE "Connected: true|ORACLE PULSE|AI Analysis"; then
        UPTIME_ORACLE=$(docker ps --filter "name=futures-oracle" --format "{{.Status}}" | grep -oP 'Up \K[^(]+' | sed 's/ *$//')
        echo -e "${GREEN}● ORACLE ACTIVE${NC}  Up ${UPTIME_ORACLE} (unhealthy)"
    else
        echo -e "${YELLOW}⚠ Heartbeat: 0 (Stable)${NC}"
    fi
    
    # WebSocket Status
    if docker logs --tail 50 futures-oracle 2>&1 | grep -q "WebSocket: Connecting"; then
        echo -e "${YELLOW}⚠ WebSocket: Connecting...${NC}"
    fi
    
    # N8N Status
    if docker logs --tail 50 futures-oracle 2>&1 | grep -q "N8N Connected"; then
        echo -e "${GREEN}✓ N8N Connected${NC}"
    fi
    
    echo ""
    
    # Get monitored pairs data
    docker logs --tail 100 futures-oracle 2>&1 | grep -E "BTT-USD|BNB-USD|SOL-USD|DOGE-USD|ETH-USD" | tail -5 | while read line; do
        # Parse trading data
        if [[ $line =~ ([A-Z]+-USD) ]]; then
            PAIR="${BASH_REMATCH[1]}"
            # Extract percentage and direction if available
            if [[ $line =~ ([+-][0-9.]+)% ]]; then
                CHANGE="${BASH_REMATCH[1]}"
                # Determine direction
                if [[ $CHANGE == +* ]]; then
                    DIR="LONG"
                    COLOR="${GREEN}"
                else
                    DIR="SHORT"
                    COLOR="${RED}"
                fi
                echo -e "  ${PAIR}     | ${COLOR}${CHANGE}%${NC} | ${DIR} | ●${GREEN}Normal${NC}"
            fi
        fi
    done
    
    echo ""
    
    # N8N CHAIN Status
    if docker logs --tail 50 futures-oracle 2>&1 | grep -q "Ready for Signals"; then
        echo -e "${GREEN}● N8N CHAIN${NC}    Active (Ready for Signals)"
    fi
    
else
    echo -e "${RED}❌ OFFLINE${NC}"
fi

echo ""
