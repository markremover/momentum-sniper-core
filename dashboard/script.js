function updateDashboard() {
    // Fetch Health
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            document.getElementById('version').innerText = data.version;

            // Format uptime
            const uptime = Math.floor(data.uptime);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            document.getElementById('uptime').innerText = `${hours}h ${minutes}m ${seconds}s`;
        })
        .catch(err => console.error('Error fetching health:', err));

    // Fetch Metrics
    fetch('/metrics')
        .then(response => response.json())
        .then(data => {
            // System Status
            const statusEl = document.getElementById('system-status');
            statusEl.innerText = data.systemStatus;
            statusEl.className = 'metric-value ' + (data.systemStatus === 'ONLINE' ? 'status-online' : 'status-offline');

            // Active Positions
            document.getElementById('active-positions').innerText = data.activePositions;

            // PnL
            const pnlEl = document.getElementById('day-pnl');
            pnlEl.innerText = data.dayPnL.toFixed(2) + '%';
            pnlEl.className = 'metric-value ' + (data.dayPnL >= 0 ? 'pnl-positive' : 'pnl-negative');

            // Last Signal
            if (data.lastSignalTime === 'N/A') {
                document.getElementById('last-signal').innerText = 'None';
            } else {
                const date = new Date(data.lastSignalTime);
                document.getElementById('last-signal').innerText = date.toLocaleTimeString();
            }
        })
        .catch(err => console.error('Error fetching metrics:', err));

    // Timestamp
    document.getElementById('timestamp').innerText = new Date().toLocaleTimeString();
}

// Update every 5 seconds
setInterval(updateDashboard, 5000);
updateDashboard();
