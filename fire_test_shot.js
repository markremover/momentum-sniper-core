const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 1. Load Environment
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error("❌ .env file missing!");
    process.exit(1);
}

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
if (!WEBHOOK_URL) {
    console.error("❌ N8N_WEBHOOK_URL is missing in .env");
    process.exit(1);
}

console.log(`🎯 TARGET: ${WEBHOOK_URL}`);
console.log(`🤖 TELEGRAM: Token exists? ${process.env.TELEGRAM_BOT_TOKEN ? 'YES ✅' : 'NO ❌'}`);

async function fire() {
    console.log("🔥 FIRING TEST SHOT (Fake SOL-USD Pump +8%)...");

    try {
        const payload = {
            type: 'PUMP_DETECTED',
            pair: 'SOL-USD',
            price: 150.50,
            change_percent: 8.5, // > 7% to ensure trigger
            volume_24h: 300000000, // $300M (High Volume)
            timestamp: Date.now()
        };

        const start = Date.now();
        const response = await axios.post(WEBHOOK_URL, payload);
        const duration = Date.now() - start;

        console.log(`✅ RESPONSE (${duration}ms):`, response.status);
        console.log("📦 DATA:", JSON.stringify(response.data, null, 2));

        if (response.data && response.data.action === 'BUY') {
            console.log("\n🎉 SUCCESS! N8N authorized the trade!");
            console.log("👉 IF YOU DO NOT SEE A TELEGRAM MESSAGE NOW -> Check TELEGRAM_BOT_TOKEN");

            // Simulating Send Telegram (Basic Check)
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;
            if (token && chatId) {
                console.log(`📲 Attempting to send Telegram manually to verify rights...`);
                try {
                    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
                    await axios.post(tgUrl, {
                        chat_id: chatId,
                        text: "🚨 TEST SIGNAL: Connectivity Verified! 🚨",
                        parse_mode: 'HTML'
                    });
                    console.log("✅ TELEGRAM SENT SUCCESSFULLY!");
                } catch (tgError) {
                    console.error("❌ TELEGRAM FAILED:", tgError.message);
                }
            }
        } else {
            console.log("\n⚠️ N8N BLOCKED OR ERROR. Reason:", response.data?.reason || "Unknown");
        }

    } catch (e) {
        console.error("❌ FATAL CONNECTION ERROR:");
        if (e.code === 'ECONNREFUSED') {
            console.error("   Connection Refused! Is N8N running on this port?");
            console.error("   Try checking: docker ps");
        } else {
            console.error("   " + e.message);
        }
    }
}

fire();
