#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

VERSION="V19.1 (Reflection Learning)"

clear
echo -e "${CYAN}=================================================${NC}"
echo -e "${CYAN}       🚀 ANTIGRAVITY COMMAND CENTER 🚀       ${NC}"
echo -e "${CYAN}=================================================${NC}"
echo ""

# 1. CHECK MOMENTUM SNIPER
echo -e "${YELLOW}╔══════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║      🎯 MOMENTUM SNIPER ${GREEN}$VERSION${YELLOW}      ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════╝${NC}"

if docker ps | grep -q "momentum-scanner"; then
    echo -e "${GREEN}✅ ACTIVE${NC} (Container: momentum-scanner)"
    echo -e "   Status: $(docker ps --filter "name=momentum-scanner" --format "{{.Status}}")"
    
    # Smart Health Check
    if docker logs --tail 100 momentum-scanner 2>&1 | grep -qE "WebSocket.*connected|Listening on.*pairs|HEARTBEAT|is moving"; then
         echo -e "   Health: ${GREEN}🟢 ONLINE & WATCHING MARKETS${NC}"
    else
         echo -e "   Health: ${YELLOW}🟡 INITIALIZING (Please wait)...${NC}"
    fi

    echo -e "   ${CYAN}Recent Activity & PnL:${NC}" 
    # Show last 3 diagnostic lines
    docker logs --tail 10 momentum-scanner 2>&1 | grep "DIAGNOSTIC" | tail -3 | sed 's/^/   / '
    # Show last PnL or Heartbeat line for context
    echo -e "   ${GREEN}💰 PnL Info:${NC} $(docker logs --tail 50 momentum-scanner 2>&1 | grep -E "PnL:|Profit:|LOSS|WIN" | tail -1 | sed 's/.*] //')"
else
    echo -e "${RED}❌ OFFLINE${NC} (Container: momentum-scanner)"
    echo -e "   ${RED}⚠️  Bot is NOT running - No signals will be sent!${NC}"
fi
echo ""

# 2. CHECK FUTURES ORACLE
echo -e "${YELLOW}╔══════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║           🔮 FUTURES ORACLE (V21)            ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════╝${NC}"

if docker ps | grep -q "futures-oracle"; then
    echo -e "${GREEN}✅ ACTIVE${NC} (Container: futures-oracle)"
    echo -e "   Status: $(docker ps --filter "name=futures-oracle" --format "{{.Status}}")"
    
    # System Health Checks (Detailed)
    WS_OK=$(docker logs --tail 100 futures-oracle 2>&1 | grep -c "WS DEBUG" || echo "0")
    N8N_URL=$(docker exec futures-oracle grep "N8N_WEBHOOK_BASE" /app/oracle.ts 2>/dev/null | grep -o "http://[^']*" || echo "unknown")
    COOLDOWN=$(docker exec futures-oracle grep "COOLDOWN_MS" /app/oracle.ts 2>/dev/null | grep -o "[0-9]* \* [0-9]* \* [0-9]*" || echo "unknown")
    TREND_OK=$(docker logs --tail 50 futures-oracle 2>&1 | grep "TREND" | grep -c "ALLOWING" || echo "0")
    BLOCKING=$(docker logs --tail 50 futures-oracle 2>&1 | grep "TREND" | grep -c "BLOCKING" || echo "0")
    
    # Display Health Status
    echo -e "   ${CYAN}System Status:${NC}"
    
    # WebSocket
    if [ "$WS_OK" -gt 0 ]; then
        echo -e "     🟢 WebSocket: ${GREEN}RECEIVING DATA${NC}"
    else
        echo -e "     🔴 WebSocket: ${RED}NO DATA${NC}"
    fi
    
    # N8N Connection
    if echo "$N8N_URL" | grep -q "172.17.0.1"; then
        echo -e "     🟢 N8N: ${GREEN}CONNECTED${NC}"
    else
        echo -e "     🔴 N8N: ${RED}WRONG URL${NC}"
    fi
    
    # Cooldown
    if echo "$COOLDOWN" | grep -q "15 \* 60 \* 1000"; then
        echo -e "     🟢 Cooldown: ${GREEN}15 MINUTES${NC}"
    elif echo "$COOLDOWN" | grep -q "3 \* 60 \* 60"; then
        echo -e "     🟡 Cooldown: ${YELLOW}3 HOURS (HIGH)${NC}"
    else
        echo -e "     🟢 Cooldown: ${GREEN}OK${NC}"
    fi
    
    # Trend Filter
    if [ "$BLOCKING" -gt 0 ]; then
        echo -e "     🔴 Trend Filter: ${RED}BLOCKING${NC}"
    elif [ "$TREND_OK" -gt 0 ]; then
        echo -e "     🟢 Trend Filter: ${GREEN}NON-BLOCKING${NC}"
    else
        echo -e "     🟢 Trend Filter: ${GREEN}OK${NC}"
    fi

    echo -e "   ${BLUE}Recent Activity:${NC}" 
    docker logs --tail 50 futures-oracle 2>&1 | grep "VELOCITY CHECK" | tail -3 | sed 's/^/   / ' || echo "   (No recent activity)"
else
    echo -e "${RED}❌ OFFLINE${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}         📋 MOMENTUM SNIPER COMMANDS 📋         ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "💡 To update Sniper (Copy line below):"
echo -e "   ${GREEN}cd ~/momentum-sniper && git pull && bash update.sh${NC}"
echo ""
echo -e "💡 To view full logs:"
echo -e "   ${GREEN}docker logs -f momentum-scanner${NC}"
echo ""
echo -e "💡 To restart Sniper:"
echo -e "   ${GREEN}cd ~/momentum-sniper && docker-compose restart scanner${NC}"
echo ""
echo -e "💡 To fire TEST signal:"
echo -e "   ${GREEN}cd ~/momentum-sniper && node fire_test_shot.js${NC}"
echo ""
echo -e "💡 To view TRADE HISTORY (V19):"
echo -e "   ${GREEN}bash ~/momentum-sniper/view_history.sh${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}         📋 FUTURES ORACLE COMMANDS 📋         ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "💡 To update Oracle (Copy line below):"
echo -e "   ${GREEN}cd ~/futures-oracle && git pull && docker-compose up -d --build${NC}"
echo ""
echo -e "💡 To start Oracle (Copy line below):"
echo -e "   ${GREEN}cd ~/futures-oracle && bash start_oracle.sh${NC}"
echo ""
echo -e "💡 To view full logs:"
echo -e "   ${GREEN}docker logs -f futures-oracle${NC}"
echo ""
echo -e "💡 To fire TEST signals:"
echo -e "   ${GREEN}docker exec -it futures-oracle node manual_trigger.js${NC}"
echo -e "${BLUE}=================================================${NC}"
