const fs = require('fs');
const path = require('path');

// 1. Определяем целевой файл
// Мы ищем его в текущей папке запуска
const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

console.log('🔍 Ищем файл терминала...');
console.log(`📂 Путь: ${targetFile}`);

if (!fs.existsSync(targetFile)) {
    console.error('\n❌ ОШИБКА: Файл src/scanner.ts НЕ НАЙДЕН!');
    console.error('⛔ Ты находишься не в той папке.');
    console.error('👉 Введи "ls", чтобы увидеть папки.');
    console.error('👉 Введи "cd momentum-sniper" (или название твоей папки), затем запусти снова.');
    process.exit(1);
}

// 2. Читаем файл
let content = fs.readFileSync(targetFile, 'utf8');

// 3. Проверяем текущее значение
const match = content.match(/VOLUME_FLOOR_USD = (\d+)/);
if (match) {
    console.log(`ℹ️ Текущий лимит объема: $${match[1]}`);
}

// 4. Применяем исправление (Ставим 250,000)
// Заменяем любое число объема на 250000
const newContent = content.replace(/VOLUME_FLOOR_USD = \d+;/g, "VOLUME_FLOOR_USD = 250000;");

if (content !== newContent) {
    fs.writeFileSync(targetFile, newContent);
    console.log('\n✅ УСПЕХ! Лимит изменен на $250,000.');
} else {
    if (content.includes('250000')) {
        console.log('\n✅ УЖЕ ГОТОВО! Лимит уже стоит $250,000.');
    } else {
        console.log('\n❌ НЕ УДАЛОСЬ изменить. Не нашел строку кода для замены.');
    }
}
