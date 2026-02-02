#!/bin/bash

# 📊 TRADE HISTORY VIEWER

HISTORY_FILE="/data/trade_history.json"

echo "════════════════════════════════════════════════"
echo "  📊 MOMENTUM SNIPER - TRADE HISTORY"
echo "════════════════════════════════════════════════"
echo ""

if [ ! -f "$HISTORY_FILE" ]; then
    echo "⚠️  No trade history found yet."
    echo "   History will be created after the first signal."
    exit 0
fi

# Count total trades
TOTAL=$(cat "$HISTORY_FILE" | jq 'length')
echo "📈 Total Trades: $TOTAL"
echo ""

# Show last 10 trades
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LAST 10 TRADES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat "$HISTORY_FILE" | jq -r '.[-10:] | .[] | 
"
🪙 \(.coin)
  💰 PnL: \(.pnl // "OPEN")%
  📊 Volume: $\(.volume / 1000000 | floor)M
  📰 News: \(.news_tier // "NULL")
  🎯 Reason: \(.reason)
  ⏰ Time: \(.timestamp | strftime("%Y-%m-%d %H:%M"))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'

echo ""
echo "💡 Full history: cat /data/trade_history.json | jq ."
echo "════════════════════════════════════════════════"
