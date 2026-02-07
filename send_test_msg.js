const https = require('https');

// ТВОИ НАСТРОЙКИ (КОТОРЫЕ МЫ НАШЛИ)
const BOT_TOKEN = "7693717998:AAGziO--PwxbNdCcShE5oZl7cZ3zxUb3eTo";
const CHAT_ID = "-5238546812"; // ID новой группы Futures

// Текст сообщения
const message = "✅ SCRIPT TEST: Connection to Futures is ACTIVE!";

// Отправка
const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
            console.log("\n✅ УСПЕХ! Сообщение отправлено в группу Futures.");
            console.log("Проверь Телеграм!");
        } else {
            console.log("\n❌ ОШИБКА:", response.description);
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
