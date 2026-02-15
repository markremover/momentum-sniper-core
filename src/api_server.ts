import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { runAnalysis } from './market_analyzer';
import { MomentumScanner } from './scanner';

export class ApiServer {
    private server: http.Server;
    private scanner: MomentumScanner;

    constructor(port: number = 3000, scanner: MomentumScanner) {
        this.scanner = scanner;
        this.server = http.createServer((req, res) => {
            // Enable CORS for dashboard
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

            if (req.method === 'GET' && req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: "ok",
                    version: process.env.VERSION || "unknown",
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                }));
            } else if (req.method === 'GET' && req.url === '/metrics') {
                const metrics = this.scanner.getMetrics();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(metrics));
            } else if (req.method === 'GET' && (req.url === '/dashboard' || req.url === '/dashboard/')) {
                // Serve index.html
                const filePath = path.join(__dirname, '../dashboard/index.html');
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading dashboard');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    }
                });
            } else if (req.method === 'GET' && (req.url === '/dashboard/script.js' || req.url === '/script.js')) {
                // Serve script.js
                const filePath = path.join(__dirname, '../dashboard/script.js');
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading script');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/javascript' });
                        res.end(data);
                    }
                });
            } else if (req.method === 'POST' && req.url === '/analyze') {
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
