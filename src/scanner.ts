

import WebSocket from 'ws';
import axios from 'axios';
import { CONFIG } from './config';
import { TradeHistory } from './tradeHistory';

interface CandleData {
    price: number;
    volume: number;
    time: number;
}

interface VirtualTrade {
    entryPrice: number;
    tpPrice: number; // Initially set but can be ignored if Trailing
    slPrice: number;
    startTime: number;
    maxPrice: number;
    alert10Sent: boolean;
    // Smart Brain V5 Fields
    trailingMode: boolean;
    lastPulseTime: number;
    initialConfidence: number;
    targetPercent: number;
    // V15 Fields
    isGhost?: boolean;
    halfSold: boolean;    // Did we sell 50% yet?
    securedPnL: number;   // Profit from the first 50%
    id: string;           // Signal ID for tracking
    mode: 'SCALP' | 'MOON'; // V18 Strategy Mode
}

interface ProductState {
    history: CandleData[];
    lastTrigger: number;
    baseVolume: number;
    activeTrade: VirtualTrade | null;
    lastTickTime: number;
}

interface DailyStats {
    date: string;
    wins: number;
    losses: number;
    totalPnL: number;
}

export class MomentumScanner {
    private ws: WebSocket | null = null;
    private isAlive: boolean = false;
    private messageCount: number = 0;

    // Memory State
    private products: Map<string, ProductState> = new Map();
    private tradeHistory: TradeHistory = new TradeHistory();  // V19: Trade logging
    private dailyStats: DailyStats = { date: '', wins: 0, losses: 0, totalPnL: 0 };
    private globalCooldowns: Map<string, number> = new Map(); // GLOBAL BAN LIST 🛑

    // Constants
    private readonly WINDOW_MS = CONFIG.SCANNER.TIME_WINDOW_MINUTES * 60 * 1000;
    private readonly COOLDOWN_MS = 30 * 60 * 1000;
    private readonly PULSE_INTERVAL_MS = 60000; // 60 seconds
    private readonly POSITION_SIZE_USD = 200; // User defined position size
    private readonly VOLUME_FLOOR_USD = 500000; // $500k Minimum Volume (Hard Floor) 🛑

    constructor() {
        console.log('[MOMENTUM] Scanner Initialized - V19 TRADE HISTORY + REFLECTION LEARNING');
        this.resetDailyStats();
    }

    public async start() {
        this.connect();
        setInterval(() => {
            if (this.isAlive) {
                this.cleanupOldData();
                this.resetDailyStats();
                const activeTrades = Array.from(this.products.values()).filter(p => p.activeTrade).length;
                console.log(`[HEARTBEAT] Pairs: ${this.products.size} | Active: ${activeTrades} | Day PnL: ${this.dailyStats.totalPnL.toFixed(2)}%`);
            }
        }, 30000);
    }

    private resetDailyStats() {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
        if (this.dailyStats.date !== today) {
            this.dailyStats = { date: today, wins: 0, losses: 0, totalPnL: 0 };
        }
    }

    private connect() {
        const url = CONFIG.COINBASE.WS_URL;
        const VERSION = 'V20.2 (STRICT MODE)';
        console.log(`[CONNECT] Connecting to ${url}...`);
        this.ws = new WebSocket(url);

        // [V17 FIX] Connection Watchdog 🐕
        const connectionTimeout = setTimeout(() => {
            if (!this.isAlive) {
                console.error('[WATCHDOG] Connection timed out. Retrying...');
                this.ws?.terminate();
                this.connect();
            }
        }, 15000);

        this.ws.on('open', () => {
            clearTimeout(connectionTimeout);
            console.log('[CONNECTED] WebSocket Open 🟢');
            this.isAlive = true;
            this.subscribe();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            this.messageCount++;
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (e) { }
        });

        this.ws.on('error', (err) => {
            console.error('[CONNECTION ERROR] WebSocket Error:', err.message);
        });

        this.ws.on('close', () => {
            clearTimeout(connectionTimeout);
            console.warn('[WARNING] Disconnected. Reconnecting in 5s...');
            this.isAlive = false;
            setTimeout(() => this.connect(), 5000);
        });
    }

    private async fetchProducts(): Promise<string[]> {
        try {
            const response = await axios.get('https://api.exchange.coinbase.com/products');
            return response.data
                .filter((p: any) => p.quote_currency === 'USD' && p.status === 'online')
                .map((p: any) => p.id);
        } catch (err) {
            return ["BTC-USD", "ETH-USD", "SOL-USD"];
        }
    }

    private async subscribe() {
        if (!this.ws) return;
        const product_ids = await this.fetchProducts();
        const subscription = {
            "type": "subscribe",
            "channel": "ticker_batch",
            "product_ids": product_ids
        };
        this.ws.send(JSON.stringify(subscription));
        console.log(`[SUBSCRIBE] Listening to ${product_ids.length} pairs`);
    }

    private handleMessage(msg: any) {
        if (msg.channel !== 'ticker_batch' || !msg.events) return;
        for (const event of msg.events) {
            if (event.type === 'snapshot' || event.type === 'update') {
                for (const ticker of event.tickers) {
                    this.processTicker(ticker);
                }
            }
        }
    }

    private processTicker(ticker: any) {
        const product_id = ticker.product_id;
        const price = parseFloat(ticker.price);
        const volume_24h = parseFloat(ticker.volume_24_h || ticker.volume_24h || '0');
        const now = Date.now();

        if (!this.products.has(product_id)) {
            this.products.set(product_id, {
                history: [],
                lastTrigger: 0,
                baseVolume: volume_24h,
                activeTrade: null,
                lastTickTime: 0
            });
        }

        const state = this.products.get(product_id)!;

        // --- SMART BRAIN V5 LOGIC ---
        if (state.activeTrade) {
            const trade = state.activeTrade;

            // 1. Update High Water Mark
            if (price > trade.maxPrice) {
                trade.maxPrice = price;
            }

            // 2. Trailing Stop Logic (Dynamic Exit: 2% -> 1%)
            if (trade.trailingMode) {
                const currentPnL = ((price - trade.entryPrice) / trade.entryPrice) * 100;

                // Dynamic Tightening
                // If PnL >= 10%, tighten trail to 1%.
                // Otherwise (e.g. initial trail), use 2%.
                const trailDistance = currentPnL >= 10 ? 0.01 : 0.02;

                const newSl = price * (1 - trailDistance);

                if (newSl > trade.slPrice) {
                    trade.slPrice = newSl;
                    // console.log(`[TRAILING] ${product_id} SL moved to ${trade.slPrice.toFixed(5)} (Gap: ${(trailDistance*100).toFixed(0)}%)`);
                }
            }

            // 3. Re-evaluation Loop (Pulse)
            if (now - trade.lastPulseTime > this.PULSE_INTERVAL_MS) {
                trade.lastPulseTime = now;
                this.sendPulse(product_id, trade, price, volume_24h);
            }

            // 4. Check Exit Conditions
            let closeType: string | null = null;
            let closeReason = "";

            if (price <= trade.slPrice) {
                const pnl = ((price - trade.entryPrice) / trade.entryPrice) * 100;
                closeType = pnl > 0 ? "WIN 🟢" : "LOSS 🔴";
                closeReason = trade.trailingMode ? "Trailing Stop Hit" : "SL Hit";
            }
            // Note: We REMOVED the Hard TP check (price >= tpPrice). 
            // We only alert now.

            // 5. Alert +10% (Legacy visual)
            if (!trade.alert10Sent) {
                const currentPnL = ((price - trade.entryPrice) / trade.entryPrice) * 100;
                if (currentPnL >= 10) {
                    this.sendAlert10Percent(product_id, price, currentPnL);
                    trade.alert10Sent = true;
                }
            }

            if (closeType) {
                this.closeTrade(product_id, trade, price, closeType, closeReason);
                state.activeTrade = null;
            }
        }

        // Throttle History
        if (now - state.lastTickTime > 2000) {
            state.history.push({ price, volume: volume_24h, time: now });
            state.lastTickTime = now;
            this.detectAnomalies(product_id, state, price, volume_24h, now);
        }
    }

    private async closeTrade(pair: string, trade: VirtualTrade, currentPrice: number, reason: string, note?: string) {
        const pnl = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
        const durationMs = Date.now() - trade.startTime;

        // 👻 GHOST LOGIC 👻
        if (trade.isGhost) {
            console.log(`[GHOST REPORT] ${pair} Closed. PnL: ${pnl.toFixed(2)}% (${reason})`);
            await this.sendGhostReport(pair, pnl, currentPrice, reason, trade, durationMs);

            // Still ban for 4 hours to prevent spam-tracking same volatility
            this.globalCooldowns.set(pair, Date.now());
            return;
        }

        // Calculate Final PnL (Weighted)
        let finalPnL = pnl;
        if (trade.halfSold) {
            // (50% * 10%) + (50% * CurrentPnL)
            finalPnL = (trade.securedPnL * 0.5) + (pnl * 0.5);
            console.log(`[WEIGHTED PnL] ${pair} Half @ 10%, Half @ ${pnl.toFixed(2)}% = Total: ${finalPnL.toFixed(2)}%`);
        }

        console.log(`[TRADE END] ${pair} PnL: ${finalPnL.toFixed(2)}% (${reason})`);
        if (finalPnL < 0) {
            this.dailyStats.losses++;
            // 🛑 BAN COIN FOR 4 HOURS ON LOSS 🛑
            this.globalCooldowns.set(pair, Date.now());
            // console.log(`[BAN] ${pair} Failed. Banned for 4 hours.`); - Already logged by ban logic usually
        } else {
            this.dailyStats.wins++;
        }
        this.dailyStats.totalPnL += finalPnL;

        console.log(`[CLOSED] ${pair} ${reason}. PnL: ${finalPnL.toFixed(2)}%`);

        // V19: Log trade EXIT
        const state = this.products.get(pair);
        const rsi = state ? this.calculateRSI(state.history) : 50;
        this.tradeHistory.append({
            timestamp: Date.now(),
            coin: pair,
            pnl: finalPnL,
            reason: reason,
            volume: 0,  // Volume not available at exit
            news_tier: null,  // Can enhance later
            rsi: rsi
        });

        this.sendTradeResult(pair, trade, currentPrice, finalPnL, durationMs, note);
    }

    private async sendPulse(pair: string, trade: VirtualTrade, currentPrice: number, volume: number) {
        const pnl = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

        // Don't spam Gemini if trade is boring (<1% change)

        const state = this.products.get(pair);
        if (!state) return;

        try {
            // [OPTIMIZATION V16.3] DISABLED AI PULSE TO SAVE CREDITS ⚡
            // AI is GATEKEEPER ONLY. Trade is purely Math.

            // --- V16.3 DYNAMIC STOP-LOSS SYNC (Hybrid) 🛡️ ---

            // 1. GLOBAL SAFETY: BREAK-EVEN AT +3% (Was +5%) 🔒
            // Real Money Rule: Don't let a +3% winner turn red.
            if (pnl >= 3 && trade.slPrice < trade.entryPrice) {
                trade.slPrice = trade.entryPrice * 1.001; // Lock Break-Even (+0.1% for fees)
                console.log(`[SAFETY] ${pair} PnL +3%. SL moved to Break-Even.`);
            }

            if (trade.mode === 'MOON') {
                // MOON RULES (Wider Stops) 🌕

                // 2. WIDER TRAILING (Give it room)
                // Only trail after +15%
                if (pnl >= 15) {
                    const moonTrail = currentPrice * 0.95;
                    if (moonTrail > trade.slPrice) trade.slPrice = moonTrail;
                }

            } else {
                // SCALP RULES (Legacy) 🏃‍♂️

                // 1. FIRST TARGET (+10%) -> SELL 50% 💰
                // ALSO ACTIVATE TRAILING STOP HERE
                if (pnl >= 10) {
                    if (!trade.halfSold) {
                        trade.halfSold = true;
                        trade.securedPnL = 10;
                        console.log(`[PARTIAL TP] ${pair} Hit +10%. Sold 50%.`);
                        this.sendPartialExitReport(pair, currentPrice);
                    }

                    // Strict 2% Trail activates at 10%
                    const trailLimit = currentPrice * 0.98;
                    if (trailLimit > trade.slPrice) trade.slPrice = trailLimit;
                }
            }

        } catch (e) {
            // Ignore Pulse errors
        }
    }

    private async checkVolumeVelocity(product_id: string, volume24h: number): Promise<boolean> {
        try {
            // Fetch last 2 candles (1 hour granularity)
            // If the last hour (or current + previous) accounts for >50% of 24h volume.
            const response = await axios.get(`https://api.exchange.coinbase.com/products/${product_id}/candles?granularity=3600&limit=2`);
            if (!response.data || response.data.length < 1) return false;

            // Coinbase Candle: [time, low, high, open, close, volume]
            // Index 5 is volume.
            const lastHourVol = response.data[0][5];

            // Check Ratio
            const ratio = lastHourVol / volume24h;
            console.log(`[VELOCITY] ${product_id} 1h Vol: ${(lastHourVol / 1e6).toFixed(1)}M / 24h: ${(volume24h / 1e6).toFixed(1)}M = Ratio: ${ratio.toFixed(2)}`);

            // V16.5 HOTFIX: Lowered from 0.5 (50%) to 0.15 (15%)
            // 50% was too strict and blocked everything.
            if (ratio >= 0.15) return true;
            return false;

        } catch (e) {
            console.error(`[VELOCITY ERROR] Could not check candles for ${product_id}`);
            return true; // Fail OPEN (Allow trade if API fails, rely on 24h volume) or FAIL SAFE? 
            // User requested strict check. But if API fails, we might miss pumps.
            // Let's return TRUE but log error.
            return true;
        }
    }

    private async detectAnomalies(product_id: string, state: ProductState, currentPrice: number, currentVolume: number, now: number) {
        if (state.activeTrade) return;

        // 1. HARD VOLUME CHECK (SAFETY 🛑)
        if (currentVolume < this.VOLUME_FLOOR_USD) {
            return;
        }

        // 2. RSI CHECK (WHALE FILTER 🐳)
        // If RSI > 80, it's overbought. Don't buy the top.
        const rsi = this.calculateRSI(state.history);
        if (rsi > 80) {
            if (Math.random() < 0.05) console.log(`[RSI BLOCK] ${product_id} RSI is ${rsi.toFixed(1)} (Too High)`);
            return;
        }

        // GLOBAL COOLDOWN CHECK 🛑
        const lastTradeTime = this.globalCooldowns.get(product_id) || 0;
        if (now - lastTradeTime < 4 * 60 * 60 * 1000) { // 4 HOURS BAN
            return;
        }

        const oldest = state.history[0];
        if (!oldest) return;

        const percentChange = ((currentPrice - oldest.price) / oldest.price) * 100;

        // --- DIAGNOSTIC LOGGING (Start) ---
        if (percentChange >= 3.0) {
            console.log(`[DIAGNOSTIC] ${product_id} is moving! +${percentChange.toFixed(2)}% | Vol: ${(currentVolume / 1e6).toFixed(2)}M`);
        }
        // --- DIAGNOSTIC LOGGING (End) ---

        if (percentChange >= 7.0) { // [USER TUNED] STRICT 7.0% SYNC
            if (now - state.lastTrigger > this.COOLDOWN_MS) {
                if (now - state.lastTrigger < 5000) return;

                // CEILING CHECK (SAFETY) 🛑
                if (percentChange > 10.5) {
                    console.log(`[SAFETY] ${product_id} Rejected. Pump +${percentChange.toFixed(2)}% > 10.5% Ceiling.`);
                    return;
                }

                // [V16.3] VOLUME VELOCITY CHECK 🏎️
                const isHighVelocity = await this.checkVolumeVelocity(product_id, currentVolume);
                if (!isHighVelocity) {
                    console.log(`[VELOCITY] ${product_id} Rejected. Volume too old/inactive.`);
                    return;
                }

                state.lastTrigger = now;

                const tp = currentPrice * 1.15;
                // [V16.3] DYNAMIC SL: -7% (Giving room to breathe)
                const sl = currentPrice * 0.93;

                // GENERATE SIGNAL ID (For Tracking) 🆔
                const signalId = Math.floor(now + Math.random() * 1000).toString(16).slice(-6).toUpperCase();

                // Await Gatekeeper Decision
                // Await Gatekeeper Decision
                // Await Gatekeeper Decision
                const { approved, confidence, predictedExit, mode, newsTier, slOverride } = await this.triggerAlert(product_id, currentPrice, percentChange, currentVolume, tp, sl, signalId);

                // Apply Override if exists
                if (slOverride) {
                    // console.log(`[SL UPDATE] Overriding SL to ${slOverride}`);
                }
                const runSl = slOverride || sl;

                if (approved) {
                    state.activeTrade = {
                        id: signalId,
                        entryPrice: currentPrice,
                        tpPrice: tp,
                        slPrice: runSl,
                        startTime: now,
                        maxPrice: currentPrice,
                        alert10Sent: false,
                        trailingMode: false,
                        lastPulseTime: now,
                        initialConfidence: confidence,
                        targetPercent: predictedExit,
                        isGhost: false,
                        halfSold: false,
                        securedPnL: 0,
                        mode: mode
                    };
                    console.log(`[TRADE STARTED] ${product_id} Entry: ${currentPrice} ID: ${signalId} Mode: ${mode}`);
                } else {
                    // REJECTED -> START GHOST TRADE 👻
                    // Track what "could have been"
                    state.activeTrade = {
                        id: signalId,
                        entryPrice: currentPrice,
                        tpPrice: tp,
                        slPrice: sl,
                        startTime: now,
                        maxPrice: currentPrice,
                        alert10Sent: false,
                        trailingMode: false,
                        lastPulseTime: now,
                        initialConfidence: 0,
                        targetPercent: 15,
                        isGhost: true,
                        halfSold: false,
                        securedPnL: 0,
                        mode: 'SCALP'
                    };
                    console.log(`[GHOST STARTED] ${product_id} Tracking rejected signal...`);
                }
            }
        }
    }

    private cleanupOldData() {
        const now = Date.now();
        const cutoff = now - this.WINDOW_MS;
        for (const [pid, state] of this.products) {
            state.history = state.history.filter(c => c.time > cutoff);
        }
    }

    private async triggerAlert(pair: string, price: number, change: number, volume: number, tp: number, sl: number, signalId: string): Promise<{ approved: boolean, confidence: number, predictedExit: number, mode: 'SCALP' | 'MOON', newsTier: number, slOverride?: number, whaleOverride?: boolean, newsSources?: string }> {
        try {
            const response = await axios.post(CONFIG.N8N.WEBHOOK_URL, {
                type: 'PUMP_DETECTED',
                pair,
                price,
                change_percent: change,
                volume_24h: volume,
                timestamp: Date.now()
            });

            let decision = response.data;
            let reason = "No reason provided (Check Logic)";

            // 1. JSON PARSING & FAILSAFE 🛡️
            if (typeof decision === 'string') {
                // Remove Markdown code blocks if present
                decision = decision.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
                try {
                    decision = JSON.parse(decision);
                } catch (e) {
                    console.error('Failed to parse n8n response:', decision);
                    // FAILSAFE: AI returned text/garbage. Check for known error phrases.
                    if (typeof response.data === 'string' && response.data.includes("Insufficient")) {
                        reason = "AI_UNCERTAINTY_BLOCK (Insufficient Data)";
                    } else {
                        reason = "AI_Response_Error (Non-JSON)";
                    }
                    await this.sendRejectionAlert(pair, reason, change, signalId);
                    return { approved: false, confidence: 0, predictedExit: 15, mode: 'SCALP', newsTier: 0 };
                }
            }

            // 2. LOGIC CHECK
            const conf = decision.confidence || 0;
            const mode = decision.mode || 'SCALP';
            const newsTier = decision.news_score || 0;
            const newsSources = decision.news_sources || "Unknown";
            const isWhaleOverride = decision.whale_override === true || (decision.reason && decision.reason.includes('SILENT WHALE'));

            // [V20.1] SILENT WHALE SL OVERRIDE 🐋
            let finalSL = sl;
            if (isWhaleOverride) {
                // Force -3% SL for Whale Plays (Safety)
                finalSL = price * 0.97;
                console.log(`[WHALE] ${pair} Silent Whale Detected! Tightening SL to -3% (${finalSL.toFixed(4)})`);
            }

            if ((decision && decision.action === 'BUY' && conf >= 75) || isWhaleOverride) {
                // V19: Log ENTRY
                const state = this.products.get(pair);
                const rsi = state ? this.calculateRSI(state.history) : 50;
                this.tradeHistory.append({
                    timestamp: Date.now(),
                    coin: pair,
                    pnl: null,  // OPEN position
                    reason: isWhaleOverride ? 'ENTRY_WHALE' : 'ENTRY',
                    volume: volume,
                    news_tier: newsTier > 0 ? (newsTier >= 8 ? 'High' : newsTier >= 5 ? 'Medium' : 'Low') : null,
                    rsi: rsi,
                    confidence: conf,
                    mode: mode
                });

                await this.sendTelegram(pair, price, change, volume, tp, finalSL, conf, decision.predicted_optimal_exit || 15, newsTier, newsSources);
                return { approved: true, confidence: conf, predictedExit: decision.predicted_optimal_exit || 15, mode: mode, newsTier: newsTier, slOverride: finalSL, whaleOverride: isWhaleOverride, newsSources: newsSources };
            } else {
                reason = decision?.reason || reason; // Use AI reason if available
                console.log(`[GATEKEEPER] Rejected ${pair}: ${reason}`);

                // V19: Log BLOCKED signals
                const state = this.products.get(pair);
                const rsi = state ? this.calculateRSI(state.history) : 50;
                this.tradeHistory.append({
                    timestamp: Date.now(),
                    coin: pair,
                    pnl: null,
                    reason: 'BLOCKED',
                    volume: volume,
                    news_tier: null,
                    rsi: rsi,
                    confidence: conf
                });

                await this.sendRejectionAlert(pair, reason, change, signalId);
                return { approved: false, confidence: 0, predictedExit: 15, mode: 'SCALP', newsTier: 0 };
            }

        } catch (err: any) {
            console.error(`[WEBHOOK ERROR] Failed to send trigger to ${CONFIG.N8N.WEBHOOK_URL}:`, err.message);
            // Default to BLOCK if n8n is down (Safety First)
            return { approved: false, confidence: 0, predictedExit: 15, mode: 'SCALP', newsTier: 0 };
        }
    }

    private async sendRejectionAlert(pair: string, reason: string, pump: number, signalId: string) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const message = `
⚠️ <b>SIGNAL REJECTED</b> ⚠️

💎 <b>${pair}</b> (+${pump.toFixed(2)}%)
🚫 <b>Reason:</b> ${reason.slice(0, 120)}
🆔 Ref: <code>${signalId}</code>

<i>Smart Brain Protection 🛡️</i>
        `;
        await this.postTelegram(token, chatId, message);
    }

    private async sendTelegram(pair: string, price: number, change: number, volume: number, tp: number, sl: number, confidence: number, predictedExit: number, newsTier: number, sources: string) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const volStr = isNaN(volume) ? 'N/A' : (volume / 1e6).toFixed(1) + 'M';

        let sizeWarning = "";
        if (newsTier < 1) {
            sizeWarning = "\n⚠️ <b>NO TIER-1 NEWS: SUGGEST 50% SIZE</b> ⚠️";
        }

        const message = `
🚀 <b>MOMENTUM ALERT</b> 🚀
${sizeWarning}

💎 <b>${pair}</b>
📈 Pump: <b>+${change.toFixed(2)}%</b>
💰 Price: ${price}
📊 Volume: ${volStr}

🏁 <b>ENTRY:</b> ${price}
🎯 <b>Target:</b> Moon (+15%+)
🛑 <b>SL:</b> ${sl.toFixed(5)} (-7%)

    // 🧠 Confidence: ${confidence}% | 🔮 Predicted Top: +${predictedExit}%
    // 📰 News: ${sources} (Tier ${newsTier})
    <i>Smart Brain Active 🧠</i>
        `;
        await this.postTelegram(token, chatId, message);
    }

    private async sendAlert10Percent(pair: string, price: number, pnl: number) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const message = `
⚠️ <b>ALMOST THERE! +${pnl.toFixed(2)}%</b> ⚠️
💎 <b>${pair}</b>
Using Dynamic Exit... 🧠
        `;
        await this.postTelegram(token, chatId, message);
    }

    private async sendGhostReport(pair: string, pnl: number, exitPrice: number, reason: string, trade: VirtualTrade, durationMs: number) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationStr = `${minutes}m ${seconds}s`;

        let status = "";
        let protectionHeader = "";

        if (pnl >= 0) {
            status = `🟢 <b>WIN!</b> Profit: <b>+${pnl.toFixed(2)}%</b>\n`;
            // V16.2: Missed Opportunity Header
            protectionHeader = `\n👻 <b>GHOST PROFIT (Missed Opportunity): +${pnl.toFixed(2)}%</b>\n`;
        } else {
            status = `🔴 <b>LOSS!</b> PnL: <b>${pnl.toFixed(2)}%</b>\n`;
            // V16.2: Protection Header
            protectionHeader = `\n🛡️ <b>PROTECTION SUCCESS: Avoided ${pnl.toFixed(2)}% Loss</b>\n`;
        }
        const maxPnl = ((trade.maxPrice - trade.entryPrice) / trade.entryPrice) * 100; // Calc Max PnL

        const message = `
👻 <b>GHOST REPORT</b> 👻
💎 <b>${pair}</b>
${protectionHeader}
${status}
🏁 Simulated Entry: ${trade.entryPrice}
🚀 <b>Max Trade Gain: +${maxPnl.toFixed(2)}%</b>
🚪 Virtual Exit: ${exitPrice}
⏱ Duration: ${durationStr}
📝 Reason: ${reason.slice(0, 120)}
🆔 Ref: <code>${trade.id}</code>

<i>Smart Brain Tracking 🧠</i>
`;
        await this.postTelegram(token, chatId, message);
    }

    private async sendTradeResult(pair: string, trade: VirtualTrade, exitPrice: number, pnl: number, durationMs: number, note?: string) {
        const maxPnl = ((trade.maxPrice - trade.entryPrice) / trade.entryPrice) * 100;
        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationStr = `${minutes}m ${seconds}s`;
        const resultType = pnl >= 0 ? "WIN" : "LOSS";

        try {
            await axios.post(CONFIG.N8N.WEBHOOK_URL, {
                type: 'TRADE_RESULT',
                pair,
                entry_price: trade.entryPrice,
                exit_price: exitPrice,
                pnl_percent: pnl,
                max_pnl_percent: maxPnl,
                duration: durationStr,
                result: resultType,
                timestamp: Date.now()
            });
        } catch (e) { }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const emoji = pnl >= 0 ? "🟢" : "🔴";
        const message = `
<b>${resultType} ${emoji} TRADE CLOSED: ${pair}</b>

🏁 Entry: ${trade.entryPrice}
🚪 Exit: ${exitPrice}
📉 PnL: <b>${pnl.toFixed(2)}%</b>
🚀 Max Trade Profit: ${maxPnl.toFixed(2)}%
⏱ Duration: ${durationStr}
${note ? `\n📝 Note: ${note}\n` : ''}
📊 <b>DAILY STATS:</b>
Wins: ${this.dailyStats.wins} | Losses: ${this.dailyStats.losses}
<b>Total PnL: ${this.dailyStats.totalPnL.toFixed(2)}%</b>
        `;
        await this.postTelegram(token, chatId, message);
    }

    private async postTelegram(token: string, chatId: string, text: string) {
        try {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            });
        } catch (e) { }
    }
    private calculateRSI(history: CandleData[]): number {
        if (history.length < 200) return 50; // Not enough data, assume neutral

        // 1. Aggregate ticks into 1-minute candles (approximate)
        // Since we store separate ticks, we can just group by minute
        const candles: number[] = [];
        let currentMinute = 0;
        let closePrice = 0;

        // Group history by minute to get Close prices
        for (const tick of history) {
            const min = Math.floor(tick.time / 60000);
            if (min !== currentMinute) {
                if (currentMinute !== 0) candles.push(closePrice);
                currentMinute = min;
            }
            closePrice = tick.price;
        }
        candles.push(closePrice);

        if (candles.length < 15) return 50; // Need 14 periods

        // 2. Calculate RSI-14
        let gains = 0;
        let losses = 0;

        // Initial Average
        for (let i = candles.length - 14; i < candles.length; i++) {
            const change = candles[i] - candles[i - 1];
            if (change > 0) gains += change;
            else losses += Math.abs(change);
        }

        let avgGain = gains / 14;
        let avgLoss = losses / 14;

        if (avgLoss === 0) return 100;

        let rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    private async sendPartialExitReport(pair: string, currentPrice: number) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        const message = `
💰 <b>PARTIAL PROFIT (50%)</b> 💰
💎 <b>${pair}</b>

📈 PnL: <b>+10%</b> (Secured)
💵 Sold 50% of bag
🛡️ SL Moved to BreakEven

<i>Runner active... 🏃‍♂️</i>
`;
        await this.postTelegram(token, chatId, message);
    }
}
