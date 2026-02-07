const https = require('https');

// Токены твоих ботов (из твоих файлов)
const BOTS = [
    { name: "CHECKING YOUR TOKEN (7693...)", token: "7693717998:AAGziO--PwxbNdCcShE5oZl7cZ3zxUb3eTo" }
];

console.log("\n🕵️  ПОИСК ЧАТОВ... (SCANNING TELEGRAM)\n");

BOTS.forEach(bot => {
    const url = `https://api.telegram.org/bot${bot.token}/getUpdates`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (!json.ok) {
                    console.log(`❌ ${bot.name}: Ошибка API (${json.error_code})`);
                    return;
                }

                const chats = new Map();

                json.result.forEach(update => {
                    const msg = update.message || update.channel_post || update.my_chat_member;
                    if (!msg) return;

                    const chat = msg.chat || (msg.chat ? msg.chat : null);
                    if (chat) {
                        chats.set(chat.id, {
                            type: chat.type,
                            title: chat.title || chat.username || "Private",
                            id: chat.id
                        });
                    }
                });

                console.log(`🤖 БОТ: ${bot.name}`);
                if (chats.size === 0) {
                    console.log("   ⚠️  Пока пусто. НАПИШИ СООБЩЕНИЕ В ГРУППУ, чтобы бот его увидел!");
                } else {
                    chats.forEach(chat => {
                        const icon = chat.type === 'private' ? 'VX' : '📢';
                        console.log(`   ${icon} ${chat.title} -> ID: ${chat.id}`);
                        if (chat.id.toString().startsWith('-100')) {
                            console.log(`      ✅ ЭТО ГРУППА/КАНАЛ! Копируй этот ID: ${chat.id}`);
                        }
                    });
                }
                console.log('--------------------------------------------------');

            } catch (e) {
                console.log(`❌ ${bot.name}: Ошибка парсинга (${e.message})`);
            }
        });
    }).on('error', (err) => {
        console.log(`❌ ${bot.name}: Ошибка сети (${err.message})`);
    });
});
