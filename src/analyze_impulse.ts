
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
    hitTarget: boolean; // Did it hit +15% from Trigger?
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyze() {
    // console.log('🚀 Starting 24H Impulse Analysis...'); 
    // Commented out "Starting" logs to keep the final output clean for Telegram

    try {
        const productsResp = await axios.get(`${API_URL}/products`);
        const products = productsResp.data.filter((p: any) => p.quote_currency === 'USD' && p.status === 'online');

        const results: AnalysisResult[] = [];
        let processed = 0;

        for (const product of products) {
            const pair = product.id;
            try {
                const statsResp = await axios.get(`${API_URL}/products/${pair}/stats`);
                const stats: ProductStats = statsResp.data;

                const open = parseFloat(stats.open);
                const high = parseFloat(stats.high);

                // 1. Trigger Condition: Price rose > 7% from Open
                const triggerPrice = open * 1.07;

                // 2. Target Condition: Price rose > 15% FROM THE TRIGGER PRICE
                // So High must be >= Trigger * 1.15
                const targetPrice = triggerPrice * 1.15;

                // Did it even trigger?
                if (high >= triggerPrice) {

                    // Calculate "Potential Profit" (from Trigger to Peak)
                    const profitPotential = ((high - triggerPrice) / triggerPrice) * 100;

                    const isWin = high >= targetPrice;

                    results.push({
                        symbol: pair,
                        openPrice: open,
                        triggerPrice: triggerPrice,
                        maxPeakPrice: high,
                        potentialPercent: profitPotential,
                        hitTarget: isWin
                    });
                }

            } catch (error) {
                // Sssh.
            }

            processed++;
            // Throttle
            await sleep(350);
        }

        // --- GENERATE REPORT FOR TELEGRAM ---

        // precise date
        const date = new Date().toLocaleDateString();

        console.log(`📊 <b>MARKET SCAN REPORT (${date})</b>\n`);
        console.log(`Scan Criteria:`);
        console.log(`🔹 Trigger: >7% from Open`);
        console.log(`🔹 Target: >15% Profit (after Trigger)\n`);

        // Sort by PROFIT POTENTIAL (Highest first)
        results.sort((a, b) => b.potentialPercent - a.potentialPercent);

        let winCount = 0;
        let totalTriggers = results.length;
        let reportLines: string[] = [];

        results.forEach(r => {
            if (r.hitTarget) winCount++;

            // Format: SYMBOL: +XX% (Peak)
            // Example: EDGE-USD: +92% 🚀
            let icon = '';
            if (r.potentialPercent >= 15) icon = '🚀';
            else if (r.potentialPercent >= 0) icon = '🟢';
            else icon = '🔻'; // Should not happen given logic

            // Only show top 20 to avoid message limit
            if (reportLines.length < 25) {
                reportLines.push(`<b>${r.symbol}</b>: +${r.potentialPercent.toFixed(1)}% ${icon}`);
            }
        });

        console.log(`📈 <b>Triggers Found:</b> ${totalTriggers}`);
        console.log(`🏆 <b>Targets Hit (+15%):</b> ${winCount}`);
        console.log(`------------------------------`);

        if (reportLines.length > 0) {
            console.log(reportLines.join('\n'));
        } else {
            console.log("No significant impulses found today.");
        }

        if (results.length > 25) {
            console.log(`\n<i>...and ${results.length - 25} more.</i>`);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

analyze();
