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
echo -e "   ${BLUE}Server Time:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. SCANNER STATUS
if docker ps | grep -q "momentum-scanner"; then
    STATUS=$(docker ps --filter "name=momentum-scanner" --format "{{.Status}}")
    echo -e "   ${GREEN}● BOT ACTIVE${NC}   $STATUS"
    
    # P&L Check
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

    echo -e "   ${BLUE}Logs (Heartbeat):${NC}"
    docker logs --tail 3 momentum-scanner 2>&1 | grep -v "Day PnL" | sed 's/^/   / '
else
    echo -e "   ${RED}● BOT OFFLINE${NC}"
fi
echo ""

# 2. FUTURES ORACLE
if docker ps | grep -q "futures-oracle"; then
    STATUS=$(docker ps --filter "name=futures-oracle" --format "{{.Status}}")
    echo -e "   ${GREEN}● ORACLE ACTIVE${NC} $STATUS"
    
    WS_OK=$(docker logs --tail 100 futures-oracle 2>&1 | grep -c "WS DEBUG")
    if [ "$WS_OK" -gt 0 ]; then
         echo -e "   ${GREEN}✓ WebSocket Online${NC}"
    else
         echo -e "   ${YELLOW}⚠ WebSocket Connecting...${NC}"
    fi
else
    echo -e "   ${RED}● ORACLE OFFLINE${NC}"
fi
echo ""

# 3. N8N CONNECTION (BRAIN)
if docker ps | grep -q "momentum-brain"; then
    echo -e "   ${GREEN}● N8N BRAIN${NC}     Active (Ready for Signals)"
else
    echo -e "   ${RED}● N8N BRAIN${NC}     OFFLINE (Check Docker)"
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
