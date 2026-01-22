const axios = require('axios');

// CONFIGURATION
const WEBHOOK_URL = 'http://localhost:5678/webhook/momentum-trigger-new-v13';

async function sendTestSignal() {
    console.log('🚀 Sending TEST SIGNAL to n8n...');

    // Fake Candle Data (Simulating a +7.5% Pump)
    const payload = {
        type: 'PUMP_DETECTED',
        pair: 'TEST-COIN-V18', // Distinct name to know it's a test
        price: 1.25,
        change_percent: 7.5, // > 7% to trigger logic
        volume_24h: 5000000,
        timestamp: Date.now()
    };

    try {
        console.log(`Target: ${WEBHOOK_URL}`);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(WEBHOOK_URL, payload);

        console.log('\n✅ SIGNAL SENT!');
        console.log('Server Response:', response.data);
        console.log('\n👉 NOW CHECK:');
        console.log('1. n8n Executions (Did it turn green?)');
        console.log('2. Telegram (Did you get a message?)');

    } catch (error) {
        console.error('\n❌ FAILED to send signal!');
        if (error.code === 'ECONNREFUSED') {
            console.error('Reason: Connection Refused. Is n8n running?');
        } else {
            console.error('Error:', error.message);
        }
    }
}

sendTestSignal();
