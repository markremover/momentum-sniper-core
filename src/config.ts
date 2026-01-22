import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
    COINBASE: {
        WS_URL: 'wss://advanced-trade-ws.coinbase.com',
        API_KEY: process.env.COINBASE_API_KEY_NAME || process.env.COINBASE_API_KEY || '',
        API_SECRET: process.env.COINBASE_API_KEY_SECRET || process.env.COINBASE_API_SECRET || '',
    },
    N8N: {
        WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/momentum-trigger',
    },
    SCANNER: {
        PRICE_CHANGE_THRESHOLD: 7, // 7%
        VOLUME_MULTIPLIER: 2,      // 2x volume
        TIME_WINDOW_MINUTES: 10,
    }
};
