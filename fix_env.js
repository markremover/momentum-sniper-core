const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// The incorrect line looks like: N8N_WEBHOOK_URL=http://localhost:5678/webhook/momentum-trigger
// The correct line should be: N8N_WEBHOOK_URL=http://localhost:5678/webhook/momentum-trigger-new-v13

if (envContent.includes('momentum-trigger-new-v13')) {
    console.log('✅ .env is ALREADY CORRECT (momentum-trigger-new-v13).');
} else if (envContent.includes('momentum-trigger')) {
    console.log('⚠️ FOUND INCORRECT URL: (Old V16 path detected)');

    const newContent = envContent.replace(
        /webhook\/momentum-trigger(\s|$)/g,
        'webhook/momentum-trigger-new-v13$1'
    );

    fs.writeFileSync(envPath, newContent);
    console.log('✅ FIXED! Updated to: .../webhook/momentum-trigger-new-v13');
} else {
    console.log('❓ Could not find the Webhook URL line to fix. Please check manualy.');
}
