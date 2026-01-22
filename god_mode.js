const fs = require('fs');
const path = require('path');
const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');
if (!fs.existsSync(targetFile)) process.exit(1);
let code = fs.readFileSync(targetFile, 'utf8');

console.log('🔓 ACTIVATING GOD MODE (Direct Line to Telegram)...');

// 1. Kill VELOCITY Filter (The Main Blocker for small coins)
// We replace the logic to ALWAYS return true
const velocityPattern = /if \(ratio >= 0\.15\) return true;/;
if (code.match(velocityPattern)) {
    code = code.replace(velocityPattern, "return true; // GOD MODE: VELOCITY IGNORED");
    console.log('   - Velocity Check: KILLED 💀');
} else {
    // Brute force bypass if pattern mismatch
    code = code.replace(/async checkVolumeVelocity\(.*\) \{/, 'async checkVolumeVelocity(pid, vol) { return true; // GOD MODE');
    console.log('   - Velocity Check: FORCE KILLED 💀');
}

// 2. Kill RSI Filter
code = code.replace(/if \(rsi > 80\)/g, "if (false && rsi > 80)");
console.log('   - RSI Filter: KILLED 💀');

// 3. Raise Ceiling (Allow crazy pumps)
code = code.replace(/if \(percentChange > 10\.5\)/g, "if (percentChange > 99.9)");
console.log('   - Ceiling: RAISED to 99% 🚀');

// 4. Low Trigger (2%)
code = code.replace("percentChange >= 7.0", "percentChange >= 2.0");
console.log('   - Trigger: LOW (2.0%) 🔥');

fs.writeFileSync(targetFile, code);
console.log('✅ GOD MODE ACTIVE. Restart now!');
