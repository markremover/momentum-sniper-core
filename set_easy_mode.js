const fs = require('fs');
const path = require('path');
const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

if (!fs.existsSync(targetFile)) process.exit(1);

let code = fs.readFileSync(targetFile, 'utf8');

// We are looking for the strict 7.0 check
// "if (percentChange >= 7.0)"
// We will change it to 2.0 temporarily

if (code.includes("percentChange >= 7.0")) {
    code = code.replace("percentChange >= 7.0", "percentChange >= 2.0");
    fs.writeFileSync(targetFile, code);
    console.log('✅ TEST MODE: Trigger lowered to 2.0% (You will see signals now!)');
} else if (code.includes("percentChange >= 2.0")) {
    console.log('✅ ALREADY IN TEST MODE (2.0%)');
} else {
    console.log('❌ Could not find "percentChange >= 7.0" in code. Check manually.');
}
