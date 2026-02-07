const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n_workflow_v20_NEWS.json');

try {
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 1. IMPROVE AGGREGATOR CODE
    // The previous aggregator might crash if input is an error object like { error: "429" }
    // We need to robustly filter valid items.

    const newAggregatorCode = "// V20.1 ROBUST AGGREGATOR\n" +
        "const params = $('Webhook').first().json.body;\n" +
        "const pair = params.pair.replace('-USD', '');\n" +
        "\n" +
        "const getFeed = (nodeName) => {\n" +
        "    try {\n" +
        "        // Filter out items that have 'error' or 'status code'\n" +
        "        const items = $items(nodeName).map(i => i.json);\n" +
        "        return items.filter(i => !i.error && !i.status_code && i.title);\n" +
        "    } catch (e) { return []; }\n" +
        "};\n" +
        "\n" +
        "const ct = getFeed('RSS Cointelegraph');\n" +
        "const cd = getFeed('RSS Coindesk');\n" +
        "const dc = getFeed('RSS Decrypt');\n" +
        "const cs = getFeed('RSS CryptoSlate');\n" +
        "const gn = getFeed('Google News RSS');\n" +
        "const lunar = $items('LunarCrush (Social)')[0] ? $items('LunarCrush (Social)')[0].json : {};\n" +
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

    const aggregatorNode = workflow.nodes.find(n => n.name === 'Aggregator (V20)');
    if (aggregatorNode) {
        aggregatorNode.parameters.jsCode = newAggregatorCode;
    }

    // 2. REFINE PROMPT FOR CLARITY
    // User asked why "Suggest 50% size". We should make this explicit in the prompt behavior.

    const promptNode = workflow.nodes.find(n => n.name === "Set Prompt (V20 Multi-Source)");
    if (promptNode && promptNode.parameters.values && promptNode.parameters.values.string) {
        const promptParam = promptNode.parameters.values.string.find(p => p.name === 'prompt_template');
        if (promptParam) {
            const currentPrompt = JSON.parse(promptParam.value);

            // Adjust Tier Logic descriptions for clarity
            currentPrompt.V20_RULES.TIER_LOGIC.TIER_0_SILENT_WHALE = "IF NO news found (Google/RSS empty) BUT Volume is High / History Good -> ACTION: BUY. Tier: 0. Reason: 'Silent Whale Accumulation'. RECOMMEND: 50% Size (Risk Management).";

            promptParam.value = JSON.stringify(currentPrompt, null, 2);
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 4));
    console.log('✅ Refined V20 Logic: Aggregator handles errors + Prompt clarifies 50% size.');

} catch (error) {
    console.error('❌ Error refining workflow:', error);
    process.exit(1);
}
