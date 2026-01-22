
import axios from 'axios';

const API_URL = 'https://api.exchange.coinbase.com';

interface ProductStats {
    open: string;
    high: string;
    low: string;
    last: string;
    volume: string;
}

interface AnalysisResult {
    symbol: string;
    openPrice: number;
    triggerPrice: number;
    maxPeakPrice: number;
    potentialPercent: number;
    hitTarget: boolean;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Module Function
export async function runAnalysis() {
    console.log('🚀 API: Starting 24H Impulse Analysis...');

    // We will capture output logs to send to Telegram as one block
    let reportLines: string[] = [];
    const log = (msg: string) => reportLines.push(msg);

    try {
        const productsResp = await axios.get(`${API_URL}/products`);
        const products = productsResp.data.filter((p: any) => p.quote_currency === 'USD' && p.status === 'online');

        const results: AnalysisResult[] = [];

        // LIMIT SCAN FOR SPEED IN API MODE? No, user wants full scan.
        // But delay might timeout the HTTP request. 
        // We will run this ASYNC and send Telegram at the end.

        for (const product of products) {
            const pair = product.id;
            let stats: ProductStats | null = null;

            // Retry Mechanism (3 attempts)
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const statsResp = await axios.get(`${API_URL}/products/${pair}/stats`, { timeout: 5000 });
                    stats = statsResp.data;
                    break; // Success
                } catch (e) {
                    if (attempt === 3) console.error(`[WARN] Failed to fetch ${pair} after 3 attempts.`);
                    await sleep(500);
                }
            }

            if (!stats) continue; // Skip if all retries failed

            try {
                const open = parseFloat(stats.open);
                const high = parseFloat(stats.high);
                const triggerPrice = open * 1.07;
                const targetPrice = triggerPrice * 1.15;

                if (triggerPrice <= 0 || isNaN(triggerPrice)) continue;

                if (high >= triggerPrice) {
                    const potential = ((high - triggerPrice) / triggerPrice) * 100;
                    if (isNaN(potential)) continue;

                    const isWin = potential >= 15; // >15% from Trigger Price

                    results.push({
                        symbol: pair,
                        openPrice: open,
                        triggerPrice: triggerPrice,
                        maxPeakPrice: high,
                        potentialPercent: potential,
                        hitTarget: isWin
                    });
                }
            } catch (error) { }
            await sleep(250); // Keep it reasonably fast
        }

        // --- REPORT GENERATION ---
        const date = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
        log(`📊 <b>MARKET SCAN REPORT (${date})</b>`);
        log(`Trigger: >7% | Target: >15% Profit\n`);

        results.sort((a, b) => b.potentialPercent - a.potentialPercent);

        let winCount = 0;
        results.forEach(r => {
            if (r.hitTarget) winCount++;
            let icon = r.hitTarget ? '🚀' : '🟢';
            if (reportLines.length < 30) {
                log(`<b>${r.symbol}</b>: +${r.potentialPercent.toFixed(1)}% ${icon}`);
            }
        });

        if (results.length > 25) log(`\n<i>...and ${results.length - 25} more.</i>`);

        log(`\n📈 <b>Triggers:</b> ${results.length}`);
        log(`🏆 <b>Targets Hit:</b> ${winCount}`);

        // Send to Telegram
        const message = reportLines.join('\n');
        await sendTelegram(message);
        console.log('✅ Analysis Report Sent to Telegram');

    } catch (err) {
        console.error('Analysis Error:', err);
    }
}

async function sendTelegram(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });
    } catch (e) {
        console.error('Telegram Error:', e);
    }
}
