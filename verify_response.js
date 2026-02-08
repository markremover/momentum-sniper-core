const axios = require('axios');

async function test() {
    console.log("🚀 Sending Test Signal to N8N...");
    try {
        const response = await axios.post('http://localhost:5678/webhook/momentum-trigger-new-v13', {
            type: 'PUMP_DETECTED',
            pair: 'TEST-USD',
            price: 100,
            change_percent: 5.5,
            volume_24h: 1000000,
            timestamp: Date.now()
        });

        console.log("\n📦 RAW RESPONSE FROM N8N:");
        console.log(JSON.stringify(response.data, null, 2));

        console.log("\n🕵️ DIAGNOSIS:");
        if (Array.isArray(response.data)) {
            console.log("⚠️ WARNING: N8N returned an ARRAY. Scanner expects an OBJECT.");
            console.log("❌ This explains the 'Ghost Reports' (Scanner cannot read 'action' from an array).");
        } else if (typeof response.data === 'object') {
            if (response.data.action) {
                console.log("✅ SUCCESS: N8N returned an OBJECT with 'action'.");
            } else {
                console.log("⚠️ WARNING: N8N returned an OBJECT, but missing 'action'.");
            }
        } else {
            console.log("⚠️ WARNING: Unknown format type: " + typeof response.data);
        }

    } catch (e) {
        console.error("❌ ERROR:", e.message);
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", e.response.data);
        }
    }
}

test();
