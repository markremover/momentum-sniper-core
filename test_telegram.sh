#!/bin/bash
# Test Telegram Bot Connection
# Reads token/chat_id from .env and sends a message

# Load .env
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not found in .env"
    exit 1
fi

echo "🚀 Sending Test Message to Telegram..."

MSG="✅ <b>MOMENTUM SNIPER V21.2</b>%0AConnection Test: <b>SUCCESS</b> 🟢%0A%0AThe bot is online and ready to snipe."

curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="$MSG" \
    -d parse_mode="HTML"

echo ""
echo "👉 Check your Telegram. If you received the message, the bot can send alerts."
