const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n_workflow_v19_FULL.json');

try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Find the target node
    const targetNode = workflow.nodes.find(n => n.name === 'Parse + Silent Whale Override (V19)');

    if (!targetNode) {
        console.error('❌ Target node not found!');
        process.exit(1);
    }

    // New JS Code with Diagnostics
    const newCode = `// V19.1: Parse Gemini Response + Silent Whale Override + DIAGNOSTICS
const signal = $node["Webhook"].json.body;
const geminiRaw = $json.candidates[0].content.parts[0].text;

// DIAGNOSTICS: Check health of upstream nodes
const diagnostics = {
    news_source: "Google News RSS",
    news_status: "✅ OK",
    history_status: "✅ OK", 
    data_quality: 100,
    timestamp: new Date().toISOString()
};

// 1. Check News Health
try {
    // Access the prompt from the prompt node
    // Note: If Set Prompt exists, it formatted the news text.
    // We check if the prompt contains the "No major news" fallback.
    // Accessing previous node data via $node["Node Name"]
    const promptInput = $node["Set Prompt (V19 Reflection)"].json.prompt_template;
    
    if (promptInput.includes("No major news search") || promptInput.includes("No major news found")) {
        diagnostics.news_status = "⚠️ NO NEWS FOUND (Google Empty)";
        diagnostics.data_quality -= 20;
    } else if (promptInput.includes("Error processing news")) {
        diagnostics.news_status = "❌ NEWS ERROR";
        diagnostics.data_quality -= 40;
    }
} catch (e) {
    diagnostics.news_status = "❓ UNKNOWN (Check Node)";
}

// 2. Check History Health
try {
    // Check output of Read Trade History node
    const historyData = $node["Read Trade History (V19)"].json;
    
    if (!historyData || historyData.total_trades === undefined) {
         diagnostics.history_status = "❌ HISTORY READ FAILED";
         diagnostics.data_quality -= 30;
    } else if (historyData.total_trades === 0) {
         diagnostics.history_status = "⚠️ HISTORY EMPTY (0 trades)";
         diagnostics.data_quality -= 10;
    } else {
         diagnostics.history_status = \`✅ ACTIVE (\${historyData.total_trades} trades)\`;
    }
} catch (e) {
    diagnostics.history_status = "❓ HISTORY DATA UNAVAILABLE";
}

// Remove markdown
let cleanResponse = geminiRaw.trim().replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '');

let geminiDecision;
try {
  geminiDecision = JSON.parse(cleanResponse);
} catch (e) {
  console.error('[V19] JSON Parse Error:', e.message);
  return [{
    json: {
      action: 'BLOCK',
      reason: 'AI Response Error (Non-JSON)',
      confidence: 0,
      mode: 'SCALP',
      news_score: 0,
      predicted_optimal_exit: 15,
      system_diagnostics: diagnostics
    }
  }];
}

// Attach Diagnostics to Final Output
geminiDecision.system_diagnostics = diagnostics;

// SILENT WHALE OVERRIDE
if (signal.volume_24h > 2500000 && 
    geminiDecision.action === 'BLOCK' &&
    (!geminiDecision.news_score || geminiDecision.news_score === 0)) {
  
  console.log(\`🐋 [SILENT WHALE OVERRIDE] \${signal.pair} - $\${(signal.volume_24h/1000000).toFixed(1)}M volume\`);
  
  return [{
    json: {
      action: 'BUY',
      reason: '🐋 SILENT WHALE: High volume override (tight SL)',
      confidence: 85,
      mode: 'SCALP',
      news_score: 0,
      predicted_optimal_exit: 12,
      whale_override: true,
      system_diagnostics: diagnostics
    }
  }];
}

// Pass through original Gemini decision with diagnostics
return [{ json: geminiDecision }];`;

    targetNode.parameters = targetNode.parameters || {};
    targetNode.parameters.jsCode = newCode;

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 4));
    console.log('✅ Workflow updated successfully with diagnostics!');

} catch (error) {
    console.error('❌ Error updating workflow:', error);
    process.exit(1);
}
