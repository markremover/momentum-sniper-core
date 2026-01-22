const fs = require('fs');
const path = require('path');
const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

if (!fs.existsSync(targetFile)) process.exit(1);

let code = fs.readFileSync(targetFile, 'utf8');

// 1. DISABLE RSI (Always return false/pass)
// "if (rsi > 80)" -> "if (false && rsi > 80)"
code = code.replace(/if \(rsi > 80\)/g, "if (false && rsi > 80)");

// 2. RAISE CEILING (10.5% -> 50.0%)
// "if (percentChange > 10.5)" -> "if (percentChange > 50.5)"
code = code.replace(/if \(percentChange > 10\.5\)/g, "if (percentChange > 50.5)");

// 3. ENSURE TRIGGER IS 2% (If not already)
if (code.includes("percentChange >= 7.0")) {
    code = code.replace("percentChange >= 7.0", "percentChange >= 2.0");
}

console.log('✅ TEST MODE SUPREME:');
console.log('   - RSI Filter: OFF 💀');
console.log('   - Ceiling: RAISED to 50% 🚀');
console.log('   - Trigger: 2% 🔥');
console.log('   NOW YOU WILL GET SIGNALS.');

fs.writeFileSync(targetFile, code);
