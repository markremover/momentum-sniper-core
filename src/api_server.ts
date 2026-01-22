
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
