const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'n8n_workflow_v19_FULL.json');
const outputPath = path.join(__dirname, 'n8n_workflow_v20_NEWS.json');

try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const workflow = JSON.parse(content);

    // ==========================================
    // 1. DEFINE NEW NODES
    // ==========================================

    // Helper to create RSS Node - Using httpRequest + xml parsing is more robust than rssFeedRead sometimes, 
    // but user asked for "RSS Read". We'll use the specific RSS Feed Read node type if available, 
    // or standard httpRequest if we want to be safe. 
    // Let's use 'n8n-nodes-base.rssFeedRead' as it handles parsing automatically.
    const createRSSNode = (id, name, url, yPos) => ({
        "parameters": { "url": url },
        "id": id,
        "name": name,
        "type": "n8n-nodes-base.rssFeedRead",
        "typeVersion": 1,
        "position": [900, yPos]
    });

    const rssNodes = [
        createRSSNode("rss-cointelegraph", "RSS Cointelegraph", "https://cointelegraph.com/rss", 0),
        createRSSNode("rss-coindesk", "RSS Coindesk", "https://www.coindesk.com/arc/outboundfeeds/rss/", 150),
        createRSSNode("rss-decrypt", "RSS Decrypt", "https://decrypt.co/feed", 300),
        createRSSNode("rss-cryptoslate", "RSS CryptoSlate", "https://cryptoslate.com/feed/", 450)
    ];

    // LunarCrush Node
    const lunarNode = {
        "parameters": {
            "url": "={{ 'https://lunarcrush.com/api3/coins/' + $json.body.pair.replace('-USD','') }}",
            "options": {
                "response": { "response": { "fullResponse": false } }
            },
            "headerParametersUi": {
                "parameter": [
                    { "name": "Authorization", "value": "Bearer YOUR_LUNAR_API_KEY" }
                ]
            }
        },
        "id": "api-lunarcrush",
        "name": "LunarCrush (Social)",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 3,
        "position": [900, 600]
    };

    // Google News (Legacy) - Keeping consistent type
    const googleNode = {
        "parameters": {
            "url": "={{ 'https://news.google.com/rss/search?q=' + $json.body.pair.replace('-USD','') + '+crypto+when:1d&hl=en-US&gl=US&ceid=US:en' }}"
        },
        "id": "rss-google",
        "name": "Google News RSS",
        "type": "n8n-nodes-base.rssFeedRead",
        "typeVersion": 1,
        "position": [900, 750]
    };

    // News Aggregator (Code Node) - Using double quotes for safety
    const aggregatorCode = "// V20 NEWS AGGREGATOR\n" +
        "const params = $('Webhook').first().json.body;\n" +
        "const pair = params.pair.replace('-USD', '');\n" +
        "\n" +
        "const getFeed = (nodeName) => {\n" +
        "    try {\n" +
        "        // n8n returns a list of items. We want the JSON content.\n" +
        "        // RSS Feed Read node outputs items with 'title', 'link', 'contentSnippet' etc.\n" +
        "        return $items(nodeName).map(i => i.json);\n" +
        "    } catch (e) { return []; }\n" +
        "};\n" +
        "\n" +
        "const ct = getFeed('RSS Cointelegraph');\n" +
        "const cd = getFeed('RSS Coindesk');\n" +
        "const dc = getFeed('RSS Decrypt');\n" +
        "const cs = getFeed('RSS CryptoSlate');\n" +
        "const gn = getFeed('Google News RSS');\n" +
        "const lunar = getFeed('LunarCrush (Social)')[0] || {};\n" +
        "\n" +
        "let allNews = [];\n" +
        "\n" +
        "// Helper to filter news for our coin\n" +
        "const filterNews = (source, items) => {\n" +
        "    return items.filter(i => {\n" +
        "        const title = (i.title || '').toLowerCase();\n" +
        "        const desc = (i.content || i.contentSnippet || i.description || '').toLowerCase();\n" +
        "        const coin = pair.toLowerCase();\n" +
        "        return title.includes(coin) || desc.includes(coin);\n" +
        "    }).map(i => `[${source}] ${i.title}`);\n" +
        "};\n" +
        "\n" +
        "allNews.push(...filterNews('CoinTelegraph', ct));\n" +
        "allNews.push(...filterNews('CoinDesk', cd));\n" +
        "allNews.push(...filterNews('Decrypt', dc));\n" +
        "allNews.push(...filterNews('CryptoSlate', cs));\n" +
        "allNews.push(...filterNews('GoogleNews', gn));\n" +
        "\n" +
        "// Social Data\n" +
        "let socialText = 'No LunarCrush Data';\n" +
        "let hasHype = false;\n" +
        "if (lunar && lunar.data) {\n" +
        "    const s = lunar.data;\n" +
        "    socialText = `Social Vol: ${s.social_volume || 0} | Rank: ${s.alt_rank || 0}`;\n" +
        "    if (s.social_volume_calc_24h_percent > 50) hasHype = true;\n" +
        "}\n" +
        "\n" +
        "const finalContext = allNews.length > 0 \n" +
        "    ? allNews.slice(0, 15).join('\\n') \n" +
        "    : 'No direct news found in major sources.';\n" +
        "\n" +
        "return [{\n" +
        "    json: {\n" +
        "        news_context: finalContext + '\\n\\n' + socialText,\n" +
        "        news_count: allNews.length,\n" +
        "        has_social_hype: hasHype\n" +
        "    }\n" +
        "}];";

    const aggregatorNode = {
        "parameters": {
            "jsCode": aggregatorCode
        },
        "id": "news-aggregator-v20",
        "name": "Aggregator (V20)",
        "type": "n8n-nodes-base.code",
        "typeVersion": 1,
        "position": [2100, 340]
    };

    // ==========================================
    // 2. REMOVE OLD NODES
    // ==========================================
    const nodesToRemove = ['Fetch Google News (RSS)', 'Parse RSS XML', 'Process News (Stable)'];
    workflow.nodes = workflow.nodes.filter(n => !nodesToRemove.includes(n.name));

    // Clean up connections using the safer delete
    for (const name of nodesToRemove) {
        if (workflow.connections[name]) delete workflow.connections[name];
    }

    // Also remove any connections pointing TO the removed nodes (e.g. from Switch)
    // We will overwrite the Switch connection anyway.

    // ==========================================
    // 3. ADD NEW NODES
    // ==========================================
    workflow.nodes.push(...rssNodes, lunarNode, googleNode, aggregatorNode);

    // ==========================================
    // 4. LINK CONNECTIONS (Serial Chain)
    // ==========================================
    // We need to support 'Read Trade History' AND the News Chain.
    // The Switch node splits them.

    // Update Switch Connection
    // Switch Output 0 originally went to [Read History, Fetch Google News].
    // Now it goes to [Read History, RSS Cointelegraph].

    const switchConn = workflow.connections['Switch Event'].main[0];
    // Remove old Google News connection if present
    const cleanSwitchConn = switchConn.filter(c => c.node !== 'Fetch Google News (RSS)' && c.node !== 'RSS Cointelegraph');

    // Add new start of chain
    cleanSwitchConn.push({ node: 'RSS Cointelegraph', type: 'main', index: 0 });
    workflow.connections['Switch Event'].main[0] = cleanSwitchConn;

    // Chain the News Nodes: CT -> CD -> DC -> CS -> Lunar -> Google -> Aggregator
    const chain = [
        'RSS Cointelegraph',
        'RSS Coindesk',
        'RSS Decrypt',
        'RSS CryptoSlate',
        'LunarCrush (Social)',
        'Google News RSS',
        'Aggregator (V20)'
    ];

    for (let i = 0; i < chain.length - 1; i++) {
        const curr = chain[i];
        const next = chain[i + 1];
        workflow.connections[curr] = {
            main: [[{ node: next, type: 'main', index: 0 }]]
        };
    }

    // Connect Aggregator to Merge
    // We assume Merge Node exists: "Merge News+Pump+History"
    // Its Input 0 was previously "Process News". Now it should be "Aggregator (V20)".
    workflow.connections['Aggregator (V20)'] = {
        main: [[{ node: 'Merge News+Pump+History', type: 'main', index: 0 }]]
    };

    // Also need to update the Merge node's incoming connection mapping? 
    // No, N8N `connections` object defines source -> dest. 
    // The Merge node just receives whatever is pointed at it.
    // BUT we deleted the connection FROM Process News logic TO Merge. 
    // So that input slot is now free and "Aggregator" fills it. Correct.

    // ==========================================
    // 5. UPDATE "SET PROMPT" (V20 SYSTEM PROMPT)
    // ==========================================
    const promptNode = workflow.nodes.find(n => n.name === 'Set Prompt (V19 Reflection)');
    if (promptNode) {
        promptNode.name = "Set Prompt (V20 Multi-Source)";
        const newPrompt = {
            "instruction": "ACT AS A CALCULATING CRYPTO WHALE ANALYST (V20). You have access to GLOBAL NEWS feeds and SOCIAL METRICS.",
            "V20_RULES": {
                "TIER_LOGIC": {
                    "TIER_7_9_CONFIRMED": "IF news found in Cointelegraph/CoinDesk/Decrypt -> STRONG BUY signal. Confidence 90+.",
                    "TIER_5_HYPE": "IF NO official news, BUT LunarCrush Social Volume jumped >50% -> SPECULATIVE BUY (Hype). Confidence 75-80.",
                    "TIER_0_SILENT_WHALE": "IF NO news AND NO social hype, BUT Volume > $2M and History shows wins -> SILENT WHALE MODE. Buy with Confidence 85."
                },
                "HISTORY_CHECK": "ALWAYS cross-reference with 'trade_history_stats'. Only approve TIER 0 if recent history has >50% win rate."
            },
            "context": "Asset: {{ $json.body.pair }} | Change: {{ $json.body.change_percent }}% | Vol: {{ $json.body.volume_24h }}",
            "news_data": "{{ $json.news_context.replace(/\"/g, \"'\") }}",
            "social_data": "Social Hype Present: {{ $json.has_social_hype }}",
            "trade_history": "{{ $json.trade_history_stats }}",
            "recent_trades": "{{ ($json.recent_history || 'None').substring(0, 1000) }}",
            "output_format": "ONLY JSON: { 'action': 'BUY/BLOCK', 'confidence': 0-100, 'tier': 0-10, 'mode': 'SCALP/MOON', 'reason': 'Cite source (CoinDesk/Lunar/History)' }"
        };

        // Update the prompt value parameter
        // Finding the right parameter structure
        if (promptNode.parameters.values && promptNode.parameters.values.string) {
            const promptParam = promptNode.parameters.values.string.find(p => p.name === 'prompt_template');
            if (promptParam) {
                promptParam.value = JSON.stringify(newPrompt, null, 2);
            }
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 4));
    console.log('✅ V20 Upgrade Generated: n8n_workflow_v20_NEWS.json');

} catch (error) {
    console.error('❌ Error upgrading workflow:', error);
    process.exit(1);
}
