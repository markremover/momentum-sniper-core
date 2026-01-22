const fs = require('fs');
const path = require('path');
const targetFile = path.join(process.cwd(), 'src', 'scanner.ts');

if (!fs.existsSync(targetFile)) process.exit(1);

let code = fs.readFileSync(targetFile, 'utf8');

// Change 250000 to 100000
if (code.includes("VOLUME_FLOOR_USD = 250000")) {
    code = code.replace("VOLUME_FLOOR_USD = 250000", "VOLUME_FLOOR_USD = 100000");
    fs.writeFileSync(targetFile, code);
    console.log('✅ VOLUME FLOOR LOWERED TO $100,000');
} else if (code.includes("VOLUME_FLOOR_USD = 100000")) {
    console.log('✅ ALREADY AT $100,000');
} else {
    // Fallback regex
    code = code.replace(/VOLUME_FLOOR_USD = \d+;/, "VOLUME_FLOOR_USD = 100000;");
    fs.writeFileSync(targetFile, code);
    console.log('✅ VOLUME FLOOR FORCED TO $100,000');
}
