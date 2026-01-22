const WebSocket = require('ws');

const url = 'wss://advanced-trade-ws.coinbase.com';
const ws = new WebSocket(url);

console.log('🕵️ STARTED: Deep Data Inspection...');

ws.on('open', function open() {
    console.log('✅ Connected. Subscribing to ETH-USD...');

    const msg = {
        "type": "subscribe",
        "channel": "ticker",
        "product_ids": ["ETH-USD"]
    };

    ws.send(JSON.stringify(msg));
});

ws.on('message', function incoming(data) {
    const text = data.toString();
    const msg = JSON.parse(text);

    if (msg.channel === 'ticker' && msg.events) {
        const ticker = msg.events[0].tickers[0];

        console.log('\n📦 RAW TICKER DATA:');
        console.log(JSON.stringify(ticker, null, 2));

        const vol1 = ticker.volume_24_h;
        const vol2 = ticker.volume_24h;
        const price = ticker.price;

        console.log('\n🔎 ANALYSIS:');
        console.log(`Price: ${price}`);
        console.log(`Volume (volume_24_h): ${vol1} (Type: ${typeof vol1})`);
        console.log(`Volume (volume_24h):   ${vol2} (Type: ${typeof vol2})`);

        const parsedVol = parseFloat(vol1 || vol2 || '0');
        console.log(`✅ PARSED VOLUME: ${parsedVol}`);

        if (parsedVol < 1000) {
            console.error('❌ CRITICAL: Volume is ZERO or very low! logic will REJECT everything.');
        } else {
            console.log('✅ Volume looks healthy (>1000).');
        }

        console.log('---------------------------------------------------');
        console.log('Test Complete. Exiting...');
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.error('❌ Error:', err.message);
});
