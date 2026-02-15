#!/bin/bash
# LUNARCRUSH DEBUGGER
# Key provided by user: ...C25 (I will find the full key in the file or previous turn)
# Previous key seen: zegf0phkyr6v7ti6cyq2v8u1emlh0bxhscogic25 (from V24 workflow)

API_KEY="zegf0phkyr6v7ti6cyq2v8u1emlh0bxhscogic25"
COIN="PNG"

echo "Testing LunarCrush V4 for $COIN..."

# Endpoint 1: api4/public/coins/[ticker] (Old?)
echo "1. Testing /public/coins/$COIN..."
curl -s -H "Authorization: Bearer $API_KEY" "https://lunarcrush.com/api4/public/coins/$COIN" | head -c 200
echo ""

# Endpoint 2: /api3/coins/[ticker] (V3 Fallback?)
echo "2. Testing /api3/coins/$COIN..."
curl -s "https://lunarcrush.com/api3/coins/$COIN?key=$API_KEY" | head -c 200
echo ""

# Endpoint 3: /api4/coins/$COIN/v1 (Possible V4)
echo "3. Testing /api4/coins/$COIN/v1..."
curl -s -H "Authorization: Bearer $API_KEY" "https://lunarcrush.com/api4/coins/$COIN/v1" | head -c 200
echo ""
