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

            // N8N Status
            const n8nEl = document.getElementById('n8n-status');
            if (data.n8nStatus) {
                n8nEl.innerText = data.n8nStatus; // CONNECTED / DISCONNECTED
                n8nEl.className = 'metric-value ' + (data.n8nStatus === 'CONNECTED' ? 'status-online' : 'status-offline');
            }

            // Version (Fallback if not in health)
            if (data.version && document.getElementById('version').innerText === '-') {
                document.getElementById('version').innerText = data.version;
            }

            // Config
            if (data.config) {
                document.getElementById('cfg-threshold').innerText = data.config.threshold + '%';
                document.getElementById('cfg-window').innerText = data.config.window + 'm';
                document.getElementById('cfg-volume').innerText = '$' + (data.config.volumeFloor / 1000).toFixed(0) + 'k';
            }

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

            // V31.2: Live Market Watch Table (>3%)
            const tableBody = document.querySelector('#signals-table tbody');
            const dataList = data.marketWatch || data.recentSignals; // Fallback

            if (dataList && dataList.length > 0) {
                tableBody.innerHTML = ''; // Clear loading/old rows
                dataList.forEach(item => {
                    const row = document.createElement('tr');
                    const volFormatted = '$' + (item.volume / 1000000).toFixed(2) + 'M';
                    const timeFormatted = new Date(item.time).toLocaleTimeString();
                    const changeFormatted = item.change ? `+${item.change.toFixed(2)}%` : 'SIGNAL'; // Handle both formats

                    row.innerHTML = `
                        <td style="font-weight:bold; color:#00ff9d;">${item.coin}</td>
                        <td style="color:#00ff9d; font-weight:bold;">${changeFormatted}</td>
                        <td>${volFormatted}</td>
                        <td style="color:#888;">${timeFormatted}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#555;">Scanning for movers > 3%...</td></tr>';
            }
        })
        .catch(err => console.error('Error fetching metrics:', err));

    // Timestamp
    document.getElementById('timestamp').innerText = new Date().toLocaleTimeString();
}

// Update every 5 seconds
setInterval(updateDashboard, 5000);
updateDashboard();
