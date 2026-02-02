const fs = require('fs');
const axios = require('axios');

const HISTORY_FILE = '/data/trade_history.json';
const LESSONS_FILE = '/data/lessons_learned.json';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function compressHistory() {
    console.log('🔄 [COMPRESS] Starting weekly trade history compression...');

    // Read current history
    if (!fs.existsSync(HISTORY_FILE)) {
        console.log('⚠️  [COMPRESS] No trade history found. Nothing to compress.');
        return;
    }

    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));

    if (history.length < 100) {
        console.log(`📊 [COMPRESS] Only ${history.length} records. Skipping compression (need 100+).`);
        return;
    }

    console.log(`📈 [COMPRESS] Found ${history.length} trade records. Analyzing...`);

    // Send to Gemini for analysis
    const prompt = `Analyze these cryptocurrency trading records and extract key lessons:

${JSON.stringify(history, null, 2)}

Output ONLY raw JSON (no markdown):
{
  "winning_patterns": ["pattern 1", "pattern 2", ...],
  "losing_patterns": ["pattern 1", "pattern 2", ...],
  "news_effectiveness": "summary of how news tier correlated with success",
  "optimal_rsi_range": "e.g., 65-75 had best win rate",
  "whale_activity_insights": "patterns from high-volume no-news trades",
  "total_analyzed": ${history.length},
  "win_rate": "X%"
}`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            }
        );

        let geminiText = response.data.candidates[0].content.parts[0].text;
        geminiText = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const lessons = JSON.parse(geminiText);

        // Save lessons
        let allLessons = [];
        if (fs.existsSync(LESSONS_FILE)) {
            allLessons = JSON.parse(fs.readFileSync(LESSONS_FILE, 'utf8'));
        }

        allLessons.push({
            timestamp: Date.now(),
            compression_date: new Date().toISOString(),
            ...lessons
        });

        fs.writeFileSync(LESSONS_FILE, JSON.stringify(allLessons, null, 2), 'utf8');
        console.log('✅ [COMPRESS] Lessons saved to lessons_learned.json');

        // Truncate history to last 100 entries
        const trimmed = history.slice(-100);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
        console.log(`✂️  [COMPRESS] Trimmed history from ${history.length} to ${trimmed.length} records`);

        console.log('✅ [COMPRESS] Weekly compression complete!');
    } catch (error) {
        console.error('❌ [COMPRESS] Error during compression:', error.message);
    }
}

compressHistory();
