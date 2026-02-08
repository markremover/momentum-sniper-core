#!/bin/bash
# Verify N8N Response Body
echo "🚀 Sending Test Payload to N8N..."

RESPONSE=$(curl -s -X POST http://localhost:5678/webhook/momentum-trigger-new-v13 \
     -H "Content-Type: application/json" \
     -d '{
           "type": "PUMP_DETECTED",
           "pair": "DEBUG-USD",
           "price": 100,
           "change_percent": 5,
           "volume_24h": 1000000,
           "timestamp": 123456789
         }')

echo ""
echo "📦 RAW RESPONSE:"
echo "$RESPONSE"
echo ""
echo "👉 If it starts with '[', it is an ARRAY (Fixed in V21.2)."
echo "👉 If it starts with '{', it is an OBJECT."
