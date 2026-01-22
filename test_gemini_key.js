const https = require('https');

const apiKey = process.argv[2];

if (!apiKey) {
    console.error("❌ Error: Please provide your API key as an argument.");
    console.error("Usage: node test_gemini_key.js YOUR_KEY_HERE");
    process.exit(1);
}

const data = JSON.stringify({
    contents: [{ parts: [{ text: "Hello" }] }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`🔍 Testing Key: ${apiKey.substring(0, 5)}...`);

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("✅ SUCCESS! The API Key is VALID.");
            console.log("Response:", body.substring(0, 100) + "...");
        } else {
            console.log(`❌ FAILURE. Status Code: ${res.statusCode}`);
            console.log("Response:", body);
        }
    });
});

req.on('error', (error) => {
    console.error("❌ Network Error:", error);
});

req.write(data);
req.end();
