const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n_workflow_v19_FULL.json');

try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 1. Filter out nodes to remove
    const nodesToRemove = ['Format Data (Log)', 'Log to Sheets'];
    workflow.nodes = workflow.nodes.filter(n => !nodesToRemove.includes(n.name));

    // 2. Clean up connections via Switch Event
    // The Switch Event connects to "Format Data (Log)" on index 1 (usually)
    if (workflow.connections['Switch Event']) {
        const switchOutputs = workflow.connections['Switch Event'].main;
        // Check output index 1 (TRADE_RESULT)
        if (switchOutputs[1]) {
            // Remove connection to Format Data (Log)
            switchOutputs[1] = switchOutputs[1].filter(conn => conn.node !== 'Format Data (Log)');
        }
    }

    // 3. Remove definitions of removed nodes from 'connections' object
    nodesToRemove.forEach(nodeName => {
        delete workflow.connections[nodeName];
    });

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 4));
    console.log('✅ Workflow cleanup successful! Removed Google Sheets nodes.');

} catch (error) {
    console.error('❌ Error cleaning workflow:', error);
    process.exit(1);
}
