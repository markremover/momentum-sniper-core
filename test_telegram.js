require('dotenv').config();
const axios = require('axios');

async function testTelegram() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log('🔍 Testing Telegram Connection...');
    console.log(`Bot Token: ${token ? 'Found ✅' : 'MISSING ❌'}`);
    console.log(`Chat ID: ${chatId ? 'Found ✅' : 'MISSING ❌'}`);

    if (!token || !chatId) {
        console.error('❌ Cannot test: Credentials missing in .env');
        return;
    }

    const message = "🔔 TEST MESSAGE: Momentum Sniper is Alive! 🔔";
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: chatId,
            text: message
        });
        console.log('\n✅ MESSAGE SENT SUCCESSFULY!');
        console.log('👉 Check your Telegram app now.');
    } catch (error) {
        console.error('\n❌ FAILED to send message.');
        console.error('Error:', error.response ? error.response.data : error.message);
        console.error('\n📢 TIP: Did you start the bot? Send /start to your bot in Telegram.');
    }
}

testTelegram();
