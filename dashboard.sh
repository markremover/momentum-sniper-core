#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo ""
echo -e "${CYAN}  __  __  ___  __  __  ___  __  __  _____  _   _  __  __ ${NC}"
echo -e "${CYAN} |  \/  |/ _ \|  \/  || __||  \/  ||_   _|| | | ||  \/  |${NC}"
echo -e "${CYAN} | |\/| | (_) | |\/| || _| | |\/| |  | |  | |_| || |\/| |${NC}"
echo -e "${CYAN} |_|  |_|\___/|_|  |_||___||_|  |_|  |_|   \___/ |_|  |_|${NC}"
echo -e "${CYAN}  ___  _   _  ___  ___  ___  ___ ${NC}"
echo -e "${CYAN} / __|| \ | ||_ _|| _ \| __|| _ \ ${NC}"
echo -e "${CYAN} \__ \| .  |  | | |  _/| _| |   / ${NC}"
echo -e "${CYAN} |___/|_|\_| |___||_|  |___||_|_\ ${NC}"
echo ""

# MOMENTUM SNIPER
echo -e "${YELLOW}=================================================${NC}"
echo -e "             ${YELLOW}MOMENTUM SNIPER${NC}"
echo -e "${YELLOW}=================================================${NC}"

if docker ps | grep -q "momentum-scanner"; then
    STATUS=$(docker ps --filter "name=momentum-scanner" --format "{{.Status}}")
    echo -e "   ${GREEN}● ACTIVE${NC}  $STATUS"
    
    # P&L
    PNL_LINE=$(docker logs --tail 50 momentum-scanner 2>&1 | grep "Day PnL:" | tail -1)
    if [ -n "$PNL_LINE" ]; then
        if echo "$PNL_LINE" | grep -q "\-"; then
             echo -e "   ${RED}🚩 P&L: $PNL_LINE${NC}"
        else
             echo -e "   ${GREEN}✅ P&L: $PNL_LINE${NC}"
        fi
    else
         echo -e "   ${BLUE}ℹ️  P&L:${NC} No trades yet"
    fi

    echo -e "   ${BLUE}Logs:${NC}"
    docker logs --tail 3 momentum-scanner 2>&1 | grep -v "Day PnL" | sed 's/^/   / '
else
    echo -e "   ${RED}● OFFLINE${NC}"
fi
echo ""

echo -e "${CYAN}   ___   ___    _    ___  _     ___ ${NC}"
echo -e "${CYAN}  / _ \ | _ \  /_\  / __|| |   | __|${NC}"
echo -e "${CYAN} | (_) ||   / / _ \| (__ | |__ | _| ${NC}"
echo -e "${CYAN}  \___/ |_|_\/_/ \_\\___||____||___|${NC}"
echo ""

# FUTURES ORACLE
echo -e "${YELLOW}=================================================${NC}"
echo -e "             ${YELLOW}FUTURES ORACLE${NC}"
echo -e "${YELLOW}=================================================${NC}"

if docker ps | grep -q "futures-oracle"; then
    STATUS=$(docker ps --filter "name=futures-oracle" --format "{{.Status}}")
    RESTARTS=$(docker inspect futures-oracle --format "{{.RestartCount}}" 2>/dev/null || echo "0")
    
    echo -e "   ${GREEN}● ACTIVE${NC}  $STATUS"
    if [ "$RESTARTS" -gt "0" ]; then
        echo -e "   Status: Restarts: $RESTARTS"
    fi
    
    # Checks
    WS_OK=$(docker logs --tail 100 futures-oracle 2>&1 | grep -c "WS DEBUG")
    [ -z "$WS_OK" ] && WS_OK=0
    
    TREND_OK=$(docker logs --tail 50 futures-oracle 2>&1 | grep "TREND" | grep -c "ALLOWING")
    
    if [ "$WS_OK" -gt 0 ]; then
        echo -e "   ${GREEN}✓ WebSocket${NC}"
    fi

    echo -e "   ${BLUE}Activity:${NC}"
    docker logs --tail 50 futures-oracle 2>&1 | grep "VELOCITY CHECK" | tail -3 | sed 's/^/   / ' || echo "   (No activity)"
else
    echo -e "   ${RED}● OFFLINE${NC}"
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
