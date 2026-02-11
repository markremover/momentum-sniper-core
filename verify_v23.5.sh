#!/bin/bash
# VERIFY V23.5 IDENTITY SCRIPT

echo "🔍 CHECKING LOGS FOR V23.5 SIGNATURES..."

# 1. VERSION HEADER
echo "----------------------------------------"
echo "1. VERSION HEADER (Must be V23.5)"
docker logs momentum-scanner 2>&1 | grep "Starting Momentum Sniper" | tail -1
echo "----------------------------------------"

# 2. USD VOLUME FORMAT
echo "2. CHECKING VOLUME FORMAT (Must be USD $X.XXM)"
# We look for lines containing "Vol: $" which indicates USD formatting added in V23.5
LOG_CHECK=$(docker logs momentum-scanner 2>&1 | grep "Vol: \$" | tail -3)

if [ -z "$LOG_CHECK" ]; then
    echo "⚠️  WARNING: No USD Volume logs found yet."
    echo "   (Wait for a coin to move > 3% or check diagnostics)"
else 
    echo "✅ CONFIRMED: USD Volume detected ($ found)"
    echo "$LOG_CHECK"
fi
echo "----------------------------------------"

# 3. CONTAINER IMAGE BUILD TIME
echo "3. CONTAINER BUILD TIME"
docker inspect -f '{{ .Created }}' momentum-scanner
echo "----------------------------------------"
