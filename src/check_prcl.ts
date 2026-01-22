
import axios from 'axios';

async function check() {
    console.log("Checking PRCL-USD...");
    try {
        const resp = await axios.get('https://api.exchange.coinbase.com/products');
        const products = resp.data;

        const prcl = products.find((p: any) => p.id === 'PRCL-USD');
        if (prcl) {
            console.log("FOUND PRCL-USD:");
            console.log(JSON.stringify(prcl, null, 2));
        } else {
            console.log("PRCL-USD NOT FOUND in product list.");
            const prclAny = products.find((p: any) => p.base_currency === 'PRCL');
            if (prclAny) {
                console.log("Found PRCL variant:", prclAny.id);
                console.log(JSON.stringify(prclAny, null, 2));
            } else {
                console.log("PRCL base currency not found at all.");
            }
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

check();
