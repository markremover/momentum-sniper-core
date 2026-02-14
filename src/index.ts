import { MomentumScanner } from './scanner';
import { ApiServer } from './api_server';

async function main() {
    console.log('Starting Momentum Sniper - Black Terminal...');
    const scanner = new MomentumScanner();
    new ApiServer(3000, scanner);
    await scanner.start();
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
