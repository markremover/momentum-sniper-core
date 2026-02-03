import * as fs from 'fs';
import * as path from 'path';

export interface TradeRecord {
    timestamp: number;
    coin: string;
    pnl: number | null;  // null for open positions
    reason: string;      // "ENTRY" | "SL_HIT" | "TP_HIT" | "BE_HIT" | "BLOCKED"
    volume: number;
    news_tier: string | null;  // "High" | "Medium" | "Low" | null
    rsi: number;
    confidence?: number;
    mode?: string;
}

export class TradeHistory {
    private filePath: string;
    private maxRecords: number = 500;  // Keep last 500 before compression

    constructor(filePath: string = '/data/trade_history.json') {
        this.filePath = filePath;
        this.ensureFileExists();
    }

    private ensureFileExists(): void {
        try {
            if (!fs.existsSync(this.filePath)) {
                fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
                console.log('[TradeHistory] Created new trade_history.json');
            }
        } catch (error) {
            console.error('[TradeHistory] Error creating file:', error);
        }
    }

    public append(record: TradeRecord): void {
        try {
            const data = this.readAll();
            data.push(record);

            // Auto-trim if too many records
            if (data.length > this.maxRecords) {
                data.splice(0, data.length - this.maxRecords);
            }

            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`[TradeHistory] Logged: ${record.coin} | ${record.reason} | PnL: ${record.pnl ?? 'OPEN'}`);
        } catch (error) {
            console.error('[TradeHistory] Error appending record:', error);
        }
    }

    public readAll(): TradeRecord[] {
        try {
            if (!fs.existsSync(this.filePath)) {
                return [];
            }
            const raw = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(raw) as TradeRecord[];
        } catch (error) {
            console.error('[TradeHistory] Error reading file:', error);
            return [];
        }
    }

    public getLastN(n: number): TradeRecord[] {
        const all = this.readAll();
        return all.slice(-n);
    }

    public getWinRate(): { wins: number, losses: number, winRate: number } {
        const all = this.readAll();
        const closed = all.filter(t => t.pnl !== null);
        const wins = closed.filter(t => t.pnl! > 0).length;
        const losses = closed.filter(t => t.pnl! <= 0).length;
        const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
        return { wins, losses, winRate };
    }
}
