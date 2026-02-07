
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
                // V19: Trade History API for N8N (Refactored to use TradeHistory class)
                const { TradeHistory } = require('./tradeHistory');
                const tradeHistory = new TradeHistory();

                try {
                    const history = tradeHistory.getLastN(50);
                    const { wins, losses, winRate } = tradeHistory.getWinRate();

                    const historyText = history.map((t: any) =>
                        `${t.coin}: ${t.reason}, PnL: ${t.pnl !== null ? t.pnl + '%' : 'OPEN'}, Vol: $${(t.volume / 1000000).toFixed(1)}M, News: ${t.news_tier || 'NULL'}`
                    ).join('\n');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        trade_history: history.length > 0 ? historyText : 'No trade history yet.',
                        total_trades: history.length,
                        win_rate: winRate.toFixed(1),
                        recent_wins: wins,
                        recent_losses: losses
                    }));
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
