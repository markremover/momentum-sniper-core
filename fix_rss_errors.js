const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n_workflow_v20_NEWS.json');

try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Target nodes: All RSS feeds and HTTP requests
    const targetTypes = ['n8n-nodes-base.rssFeedRead', 'n8n-nodes-base.httpRequest'];

    workflow.nodes.forEach(node => {
        if (targetTypes.includes(node.type)) {
            // Enable "Continue On Fail"
            node.continueOnFail = true;

            // Also need to ensure it doesn't just stop.
            // In n8n JSON, continueOnFail: true is a top-level property of the node object.

            // Optional: Add onError strategy if needed, usually continueOnFail is enough to output an error item 
            // and let the next node handle it.
            // Our "Aggregator" script uses try/catch around $items(), so it should handle error items safely.
        }
    });

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 4));
    console.log('✅ Emergency Fix Applied: All RSS/HTTP nodes set to Continue On Fail.');

} catch (error) {
    console.error('❌ Error fixing workflow:', error);
    process.exit(1);
}
