
const https = require('https');

function check() {
    console.log("Checking PRCL-USD...");
    https.get('https://api.exchange.coinbase.com/products', { headers: { 'User-Agent': 'Node.js' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const products = JSON.parse(data);
                const prcl = products.find(p => p.id === 'PRCL-USD');
                if (prcl) {
                    console.log("FOUND PRCL-USD:");
                    console.log(JSON.stringify(prcl, null, 2));
                } else {
                    console.log("PRCL-USD NOT FOUND in product list.");
                    // Check partial match
                    const partial = products.filter(p => p.id.includes('PRCL'));
                    if (partial.length > 0) {
                        console.log("Found PRCL variants:", partial.map(p => p.id));
                    }
                }
            } catch (e) {
                console.error("Parse Error:", e.message);
            }
        });
    }).on('error', (e) => {
        console.error("Request Error:", e.message);
    });
}

check();
