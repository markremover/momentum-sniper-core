#!/bin/bash
GREEN='\033[1;32m' # Bright Green
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo ""
echo -e "${YELLOW}=================================================${NC}"
echo -e "         ${GREEN}MOMENTUM SNIPER ${YELLOW}V20.1${NC}"
echo -e "${YELLOW}=================================================${NC}"

if docker ps | grep -q "momentum-scanner"; then
    STATUS=$(docker ps --filter "name=momentum-scanner" --format "{{.Status}}")
    echo -e "   ${GREEN}● ACTIVE${NC}  $STATUS"
    
    # RECOVERED STATS 
    # (Assuming we can grep 'Pairs:' from logs if it exists, or just show Heartbeat)
    # The user asked for "Pairs" specifically. 
    # If the bot logs "Tracking X pairs", we can show it.
    PAIRS_COUNT=$(docker logs --tail 200 momentum-scanner 2>&1 | grep "Tracking" | tail -1 | grep -o "[0-9]* pairs" || echo "Checking...")
    
    echo -e "   ${BLUE}pairs:${NC} $PAIRS_COUNT"

    # P&L
    PNL_LINE=$(docker logs --tail 50 momentum-scanner 2>&1 | grep "Day PnL:" | tail -1)
    if [ -n "$PNL_LINE" ]; then
        if echo "$PNL_LINE" | grep -q "\-"; then
             echo -e "   ${RED}🚩 $PNL_LINE${NC}"
        else
             echo -e "   ${GREEN}✅ $PNL_LINE${NC}"
        fi
    else
         echo -e "   ${YELLOW}⏳ P&L: Waiting for data...${NC}"
    fi

    echo -e "   ${BLUE}Logs:${NC}"
    docker logs --tail 3 momentum-scanner 2>&1 | grep -v "Day PnL" | sed 's/^/   / '
else
    echo -e "   ${RED}● OFFLINE${NC}"
fi
echo ""

# FUTURES ORACLE
echo -e "${YELLOW}=================================================${NC}"
echo -e "         ${YELLOW}FUTURES ORACLE${NC}"
echo -e "${YELLOW}=================================================${NC}"

if docker ps | grep -q "futures-oracle"; then
    STATUS=$(docker ps --filter "name=futures-oracle" --format "{{.Status}}")
    echo -e "   ${GREEN}● ACTIVE${NC}  $STATUS"
    
    # Simple Heartbeat Check
    WS_OK=$(docker logs --tail 100 futures-oracle 2>&1 | grep -c "WS DEBUG")
    if [ "$WS_OK" -gt 0 ]; then
         echo -e "   ${GREEN}✓ WebSocket Online${NC}"
    else
         echo -e "   ${YELLOW}⚠ WebSocket Connecting...${NC}"
    fi

    echo -e "   ${BLUE}Activity:${NC}"
    docker logs --tail 50 futures-oracle 2>&1 | grep "VELOCITY CHECK" | tail -3 | sed 's/^/   / ' || echo "   (No activity)"
else
    echo -e "   ${RED}● OFFLINE${NC}"
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
