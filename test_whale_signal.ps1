$url = "http://localhost:5678/webhook/momentum-trigger-new-v13"
# NOTE: If running from Windows against a remote VPS, replace 'localhost' with your VPS IP Address!

$body = @{
    type = "PUMP_DETECTED"
    pair = "ETH-USD"
    change_percent = 8.5
    volume_24h = 15000000
    price = 3500.00
    time = (Get-Date).Millisecond
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ SIGNAL SENT!" -ForegroundColor Green
    Write-Host "Check your N8N Executions tab." -ForegroundColor Yellow
    Write-Host "Response:"
    $response | Format-List
} catch {
    Write-Host "❌ ERROR: Could not reach N8N at $url" -ForegroundColor Red
    Write-Host "If testing remote VPS, edit the URL in this script to use your VPS IP."
}
