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
echo ""
echo -e "${YELLOW}=================================================${NC}"
ORACLE_VERSION=$(cd ~/futures-oracle 2>/dev/null && git log --oneline -1 2>/dev/null | awk '{print $1}' || echo "unknown")
echo -e "         ${GREEN}FUTURES ORACLE ${YELLOW}${ORACLE_VERSION}${NC}"
echo -e "${YELLOW}=================================================${NC}"

if docker ps | grep -q "futures-oracle"; then
    STATUS=$(docker ps --filter "name=futures-oracle" --format "{{.Status}}")
    RESTARTS=$(docker inspect futures-oracle --format "{{.RestartCount}}" 2>/dev/null || echo "0")
    
    echo -e "   ${GREEN}● ORACLE ACTIVE${NC}   $STATUS"
    
    # Restart Warning
    if [ "$RESTARTS" -gt "5" ]; then
        echo -e "   ${RED}⚠ Restarts: $RESTARTS (High!)${NC}"
    elif [ "$RESTARTS" -gt "0" ]; then
        echo -e "   ${YELLOW}⚠ Restarts: $RESTARTS${NC}"
    else
        echo -e "   ${GREEN}✓ Restarts: $RESTARTS (Stable)${NC}"
    fi
    
    # WebSocket Check
    WS_OK=$(docker logs --tail 100 futures-oracle 2>&1 | grep -c "WS DEBUG")
    if [ "$WS_OK" -gt 0 ]; then
         echo -e "   ${GREEN}✓ WebSocket Online${NC}"
    else
         echo -e "   ${YELLOW}⚠ WebSocket Connecting...${NC}"
    fi
    
    # N8N Connection Check (for Oracle)
    N8N_URL=$(docker exec futures-oracle grep "N8N_WEBHOOK_BASE" /app/oracle.ts 2>/dev/null | grep -o "http://[^']*" || echo "")
    if echo "$N8N_URL" | grep -q "172.17.0.1"; then
        echo -e "   ${GREEN}✓ N8N Connected${NC}"
    else
        echo -e "   ${RED}✗ N8N Connection Error${NC}"
    fi
else
    echo -e "   ${RED}● ORACLE OFFLINE${NC}"
fi
echo ""

# 3. N8N BRAIN (Global)
if docker ps | grep -q "momentum-brain"; then
    echo -e "   ${GREEN}● N8N BRAIN${NC}     Active (Ready for Signals)"
else
    echo -e "   ${RED}● N8N BRAIN${NC}     OFFLINE (Check Docker)"
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
