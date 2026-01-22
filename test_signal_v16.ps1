$url = "http://localhost:5678/webhook/momentum-trigger-new-v13"
# ⚠️ ВАЖНО: Если N8N на сервере, замените 'localhost' на IP вашего VPS!
# Пример: $url = "http://123.45.67.89:5678/webhook/momentum-trigger-new-v13"

$body = @{
    type           = "PUMP_DETECTED"
    pair           = "TEST-COIN-V16"
    change_percent = 5.5
    volume_24h     = 5000000
    price          = 1.25
    timestamp      = [int64]((Get-Date).ToUniversalTime() - (Get-Date "1/1/1970")).TotalMilliseconds
} | ConvertTo-Json

Write-Host "🚀 Отправляем Тестовый Сигнал V16..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ СИГНАЛ ОТПРАВЛЕН!" -ForegroundColor Green
    Write-Host "1. Проверь N8N (Executions)" -ForegroundColor Yellow
    Write-Host "2. Проверь Telegram (Пришло ли сообщение?)" -ForegroundColor Yellow
    Write-Host "Ответ сервера:"
    $response | Format-List
}
catch {
    Write-Host "❌ ОШИБКА: Не могу достучаться до N8N!" -ForegroundColor Red
    Write-Host "Убедись, что N8N запущен и URL правильный."
    Write-Host $_.Exception.Message
}
