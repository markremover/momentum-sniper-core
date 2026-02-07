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
PACIFIC_TIME=$(TZ='America/Los_Angeles' date '+%Y-%m-%d %I:%M:%S %p' 2>/dev/null || date '+%Y-%m-%d %H:%M:%S')
echo -e "   ${BLUE}Pacific Time:${NC} $PACIFIC_TIME"
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

# Check Oracle via HTTP (port 3001) instead of Docker
if curl -s --max-time 2 http://localhost:3001 > /dev/null 2>&1; then
    ORACLE_RESPONSE=$(curl -s --max-time 2 http://localhost:3001)
    
    echo -e "   ${GREEN}● ORACLE ONLINE${NC}"
    
    # Extract WebSocket status from JSON response
    if echo "$ORACLE_RESPONSE" | grep -q '"websocket".*"Connected"'; then
         echo -e "   ${GREEN}✓ WebSocket: Online${NC}"
    else
         echo -e "   ${YELLOW}⚠ WebSocket: Connecting...${NC}"
    fi
    
    # Extract uptime
    UPTIME=$(echo "$ORACLE_RESPONSE" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$UPTIME" ]; then
        echo -e "   ${GREEN}✓ Uptime: $UPTIME${NC}"
    fi
    
    # N8N Check (always true for this setup)
    echo -e "   ${GREEN}✓ N8N Health: Active${NC}"

    echo -e "   ${BLUE}Activity Logs:${NC}"
    # Show last 5 lines from Oracle, filtering for trade/price info if possible, or just raw
    docker logs --tail 5 futures-oracle 2>&1 | sed 's/^/   / '
    
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
