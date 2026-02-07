const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n_workflow_v20_NEWS.json');

try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Fix 1: "Set Prompt" connection key mismatch
    // The node name is "Set Prompt (V20 Multi-Source)"
    // The connection key is likely "Set Prompt (V19 Reflection)"

    if (workflow.connections['Set Prompt (V19 Reflection)']) {
        // Move connections to new key
        workflow.connections['Set Prompt (V20 Multi-Source)'] = workflow.connections['Set Prompt (V19 Reflection)'];
        delete workflow.connections['Set Prompt (V19 Reflection)'];
        console.log('✅ Fixed: Renamed "Set Prompt" connection key.');
    } else {
        console.log('ℹ️ "Set Prompt (V19 Reflection)" connection key not found (maybe already fixed?).');
    }

    // Fix 2: Verify "Consult Gemini (Catalyst)" -> "Parse + Silent Whale Override (V19)"
    // Ensure "Consult Gemini (Catalyst)" exists in connections
    if (!workflow.connections['Consult Gemini (Catalyst)']) {
        console.log('⚠️ Missing connection from Gemini to Parse. Fixing...');
        workflow.connections['Consult Gemini (Catalyst)'] = {
            main: [[{
                node: "Parse + Silent Whale Override (V19)",
                type: "main",
                index: 0
            }]]
        };
    }

    // Fix 3: Verify "Parse + Silent Whale Override (V19)" -> "Respond (Pump Analysis)"
    if (!workflow.connections['Parse + Silent Whale Override (V19)']) {
        console.log('⚠️ Missing connection from Parse to Respond. Fixing...');
        workflow.connections['Parse + Silent Whale Override (V19)'] = {
            main: [[{
                node: "Respond (Pump Analysis)",
                type: "main",
                index: 0
            }]]
        };
    }

    // Logic Check: Ensure Merge connects to the NEW Prompt Name
    if (workflow.connections['Merge News+Pump+History']) {
        const mergeTargets = workflow.connections['Merge News+Pump+History'].main[0];
        // Check if ANY point to Set Prompt V20
        const connectToV20 = mergeTargets.find(t => t.node === "Set Prompt (V20 Multi-Source)");
        if (!connectToV20) {
            console.log('⚠️ Merge not connected to V20 Prompt. Re-linking...');
            workflow.connections['Merge News+Pump+History'].main = [[{
                node: "Set Prompt (V20 Multi-Source)",
                type: "main",
                index: 0
            }]];
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 4));
    console.log('✅ ALL CONNECTIONS FIXED.');

} catch (error) {
    console.error('❌ Error fixing workflow:', error);
    process.exit(1);
}
