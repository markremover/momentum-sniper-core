const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

if (!fs.existsSync(targetFile)) {
    console.error('❌ Scanner.ts not found!');
    process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

// We will inject a PROBE at the very top of detectAnomalies
// It will print debug info SPECIFICALLY for ETH-USD so we don't flood the console
const probeCode = `
    // --- PROBE START ---
    if (product_id === 'ETH-USD') {
        const _volUSD = currentVolume * currentPrice;
        const _oldest = state.history[0];
        const _chg = _oldest ? ((currentPrice - _oldest.price) / _oldest.price) * 100 : 0;
        
        console.log(\`[PROBE] ETH-USD | Price: \${currentPrice} | VolUSD: \${(_volUSD/1e6).toFixed(2)}M | Chg: \${_chg.toFixed(3)}% | Trigger: 7.0%\`);
        
        if (_volUSD < this.VOLUME_FLOOR_USD) console.log(\`[PROBE] 🔴 BLOCKED BY VOLUME (\${this.VOLUME_FLOOR_USD/1e6}M)\`);
    }
    // --- PROBE END ---
`;

// Inject before the "if (state.activeTrade) return;" line or similar start of function
if (!code.includes('[PROBE] ETH-USD')) {
    const hook = "if (state.activeTrade) return;";
    if (code.includes(hook)) {
        code = code.replace(hook, probeCode + "\n" + hook);
        fs.writeFileSync(targetFile, code);
        console.log('✅ PROBE INSTALLED! Restart terminal to see ETH-USD internal logic.');
    } else {
        console.log('❌ Could not find injection point in scanner.ts');
    }
} else {
    console.log('✅ PROBE ALREADY INSTALLED.');
}
