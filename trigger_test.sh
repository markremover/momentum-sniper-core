#!/bin/bash

# MOMENTUM SNIPER - CONNECTION TEST
# Sends a FAKE signal to N8N to verify the workflow triggers.

echo "🚀 SENDING TEST SIGNAL TO N8N..."
echo "Payload: TEST-USD +10.5% (Simulation)"

curl -X POST http://localhost:5678/webhook/momentum-trigger \
     -H "Content-Type: application/json" \
     -d '{
           "type": "PUMP_DETECTED",
           "pair": "TEST-USD",
           "price": 100,
           "change_percent": 10.5,
           "volume_24h": 50000000,
           "timestamp": 1234567890,
           "is_test": true
         }'

echo ""
echo "✅ SIGNAL SENT!"
echo "👉 Check your N8N Workflow Executions page NOW."
echo "If you see a new execution, the connection is PERFECT."
