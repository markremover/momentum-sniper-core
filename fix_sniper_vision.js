const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

if (!fs.existsSync(targetFile)) {
    console.error('❌ Scanner.ts not found!');
    process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

// The incorrect line uses .timestamp
const wrongCode = "_oldest.timestamp";
// The correct property is .time (based on interface CandleData)
const correctCode = "_oldest.time";

if (code.includes(wrongCode)) {
    code = code.replace(wrongCode, correctCode);
    fs.writeFileSync(targetFile, code);
    console.log('✅ FIX APPLIED: Replaced .timestamp with .time');
} else if (code.includes(correctCode)) {
    console.log('✅ CODE IS ALREADY CORRECT (.time)');
} else {
    console.log('⚠️ Could not find the specific line to fix. Please check manually.');
}
