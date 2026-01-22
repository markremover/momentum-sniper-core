const WebSocket = require('ws');

const url = 'wss://advanced-trade-ws.coinbase.com';
const ws = new WebSocket(url);

console.log('🔌 Connecting to Coinbase Raw Stream...');

ws.on('open', function open() {
    console.log('✅ Connected! Subscribing to BTC-USD...');

    const msg = {
        "type": "subscribe",
        "channel": "ticker",
        "product_ids": ["BTC-USD"]
    };

    ws.send(JSON.stringify(msg));
});

ws.on('message', function incoming(data) {
    console.log('📨 Data received:', data.toString().substring(0, 100) + '...');
    // Only show 5 messages then exit
    if (Math.random() > 0.8) {
        console.log('... (Data is flowing, exiting test)');
        process.exit(0);
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket Error:', err.message);
});
