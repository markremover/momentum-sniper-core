---
description: Безопасное обновление Google Cloud сервера (БЕЗ утечек API ключей)
---

# 🔒 БЕЗОПАСНОЕ ОБНОВЛЕНИЕ GOOGLE CLOUD

## ⚠️ ВАЖНАЯ ПАМЯТКА ДЛЯ AI:

**НИКОГДА НЕ КОММИТЬ В GIT:**
- ❌ API ключи (Google Sheet key, Gemini API, Telegram Bot Token)
- ❌ Файлы `.env`
- ❌ Файлы с "key" или "token" в названии
- ❌ Credentials файлы

**ВСЕГДА ПРОВЕРЯЙ `.gitignore` ПЕРЕД `git add`!**

---

## ✅ БЕЗОПАСНАЯ КОМАНДА ДЛЯ ОБНОВЛЕНИЯ СЕРВЕРА:

### Для Momentum Sniper:

```bash
cd ~/momentum-sniper && git pull && docker-compose down && docker-compose up -d --build
```

**Что делает:**
1. `cd ~/momentum-sniper` - Переход в директорию
2. `git pull` - Скачивает ТОЛЬКО код с GitHub (без секретов!)
3. `docker-compose down` - Останавливает контейнеры
4. `docker-compose up -d --build` - Пересобирает и запускает

**⏱️ Время:** 2-3 минуты

---

### Для Futures Oracle:

```bash
cd ~/futures-oracle && git pull && docker-compose up -d --build
```

---

## 🔍 ПРОВЕРКА ПОСЛЕ ОБНОВЛЕНИЯ:

### 1. Проверь статус контейнеров:
```bash
docker ps
```

**Должно показать:**
```
momentum-scanner  Up X seconds
momentum-brain    Up X seconds
futures-oracle    Up X seconds
```

---

### 2. Проверь логи (если что-то сломалось):
```bash
docker logs --tail 50 momentum-scanner
```

---

### 3. Проверь через menu:
```bash
menu
```

**Должно показать:**
- ✅ Momentum Sniper: ACTIVE
- ✅ Futures Oracle: ACTIVE

---

## 🚫 ЕСЛИ ВИДИШЬ ОШИБКУ "Permission denied":

```bash
cd ~/momentum-sniper
sudo chown -R $USER:$USER .
docker-compose restart
```

---

## 📝 ИСТОРИЯ ОБНОВЛЕНИЙ:

**V19 (2026-02-02):**
- Trade History Tracking
- Reflection Learning
- Silent Whale Override
- Weekly Compression

**V16.4:**
- News Score system
- Gemini 2.0 Flash
- Robust error handling

---

## 💡 WORKFLOW USAGE:

**Чтобы AI дал эту команду:**
```
/update-server
```

**Или просто спроси:**
"Дай команду для обновления сервера"
