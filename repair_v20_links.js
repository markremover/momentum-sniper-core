const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n_workflow_v20_NEWS.json');

try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Define the specific missing link
    // Source: "Merge News+Pump+History"
    // Dest: "Set Prompt (V20 Multi-Source)"

    // Ensure the Source Node exists in connections
    if (!workflow.connections['Merge News+Pump+History']) {
        workflow.connections['Merge News+Pump+History'] = { main: [] };
    }

    // Force the connection
    workflow.connections['Merge News+Pump+History'].main = [
        [
            {
                node: "Set Prompt (V20 Multi-Source)",
                type: "main",
                index: 0
            }
        ]
    ];

    // Also verifying the Pulse branch just in case
    // Switch -> Set Config (Pulse)
    // This usually sits on output 2 of Switch (index 2)
    // Let's verify Switch connections
    /*
    const switchConn = workflow.connections['Switch Event'].main;
    // index 0: PUMP -> [Read History, RSS Cointelegraph]
    // index 1: RESULT -> [] (Empty, we removed logging)
    // index 2: PULSE -> [Set Config (Pulse)]
    */

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 4));
    console.log('✅ Workflow Link Repaired: Merge -> Set Prompt');

} catch (error) {
    console.error('❌ Error repairing workflow:', error);
    process.exit(1);
}
