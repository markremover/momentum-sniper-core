
import * as http from 'http';
import { runAnalysis } from './market_analyzer';

export class ApiServer {
    private server: http.Server;

    constructor(port: number = 3000) {
        this.server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/analyze') {
                console.log('[API] Received Analysis Request');

                // Trigger Async Analysis
                runAnalysis().catch(err => console.error('[API] Analysis Failed:', err));

                // Respond immediately
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'started', message: 'Analysis started. Check Telegram in ~3 minutes.' }));
            } else if (req.method === 'GET' && req.url === '/trade-history') {
                // V19: Trade History API for N8N
                const fs = require('fs');
                const historyPath = '/data/trade_history.json';

                try {
                    if (fs.existsSync(historyPath)) {
                        const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                        const history = data.slice(-50);

                        const wins = history.filter((t: any) => t.pnl && t.pnl > 0).length;
                        const losses = history.filter((t: any) => t.pnl && t.pnl <= 0).length;
                        const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';

                        const historyText = history.map((t: any) =>
                            `${t.coin}: ${t.reason}, PnL: ${t.pnl || 'OPEN'}%, Vol: $${(t.volume / 1000000).toFixed(1)}M, News: ${t.news_tier || 'NULL'}`
                        ).join('\n');

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            trade_history: historyText,
                            total_trades: history.length,
                            win_rate: winRate,
                            recent_wins: wins,
                            recent_losses: losses
                        }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            trade_history: 'No trade history yet.',
                            total_trades: 0,
                            win_rate: '0',
                            recent_wins: 0,
                            recent_losses: 0
                        }));
                    }
                } catch (error) {
                    console.error('[API] Trade History Error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        trade_history: 'Error reading history',
                        total_trades: 0,
                        win_rate: '0',
                        recent_wins: 0,
                        recent_losses: 0
                    }));
                }
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        this.server.listen(port, '0.0.0.0', () => {
            console.log(`[API] Server listening on port ${port} (0.0.0.0)`);
        });
    }
}
