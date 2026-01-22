const fs = require('fs');
const path = require('path');
const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

if (!fs.existsSync(targetFile)) process.exit(1);

let code = fs.readFileSync(targetFile, 'utf8');

if (code.includes("percentChange >= 2.0")) {
    code = code.replace("percentChange >= 2.0", "percentChange >= 7.0");
    fs.writeFileSync(targetFile, code);
    console.log('✅ PROTECTION RESTORED: Trigger back to 7.0%');
} else {
    console.log('✅ ALREADY SECURE (7.0% or other value)');
}
