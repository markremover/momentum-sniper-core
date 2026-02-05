#!/bin/bash
# Check version of key files
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 VERIFYING V19.1 INSTALLATION..."
echo "-----------------------------------"

# 1. Check package.json
if grep -q "19.1.0" package.json; then
    echo -e "✅ package.json: ${GREEN}v19.1.0 FOUND${NC}"
else
    echo -e "❌ package.json: ${RED}OLD VERSION${NC}"
fi

# 2. Check N8N Workflow for Reflection Logic
if grep -q "REFLECTION_ANALYSIS" n8n_workflow_v19_FULL.json; then
    echo -e "✅ N8N Workflow: ${GREEN}REFLECTION LOGIC FOUND${NC}"
else
    echo -e "❌ N8N Workflow: ${RED}MISSING NEW PROMPT${NC}"
fi

# 3. Check Dashboard PnL Logic
if grep -q "SMART PnL DISPLAY" dashboard.sh; then
    echo -e "✅ Dashboard:    ${GREEN}PnL COLORS ACTIVE${NC}"
else
    echo -e "❌ Dashboard:    ${RED}OLD DASHBOARD${NC}"
fi

echo "-----------------------------------"
echo "If all checked are GREEN, you are 100% on V19.1!"
