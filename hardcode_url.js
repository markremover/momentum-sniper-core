const fs = require('fs');
const path = require('path');
const targetFile = path.join(process.cwd(), 'src', 'config.ts');

if (!fs.existsSync(targetFile)) {
    console.error('❌ Config.ts not found!');
    process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

// The Correct URL
const CORRECT_URL = "'http://localhost:5678/webhook/momentum-trigger-new-v13'";

// Use Regex to replace the entire WEBHOOK_URL line
// It catches: WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '...'
const regex = /WEBHOOK_URL:\s*process\.env\.N8N_WEBHOOK_URL\s*\|\|\s*['"`].*?['"`]/;

if (regex.test(code)) {
    code = code.replace(regex, `WEBHOOK_URL: ${CORRECT_URL}`);
    fs.writeFileSync(targetFile, code);
    console.log('✅ FORCE FIXED: Config now uses HARDCODED URL (No more .env issues)');
} else if (code.includes('momentum-trigger-new-v13')) {
    console.log('✅ Config is ALREADY fixed.');
} else {
    console.log('⚠️ Could not find the config line using Regex. Trying fallback...');
    // Fallback: Just replace the fallback string if the first replacement failed
    code = code.replace(/'http:\/\/n8n:5678\/webhook\/momentum-trigger'/, CORRECT_URL);
    fs.writeFileSync(targetFile, code);
    console.log('✅ FORCE FIXED (Fallback method).');
}
