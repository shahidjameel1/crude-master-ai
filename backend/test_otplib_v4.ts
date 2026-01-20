import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const otplib = require('otplib');

const secret = '7ZJGYOQ4UUYL6SKJU4SY4WMB6A';

async function test() {
    console.log('TOTP Type:', typeof otplib.TOTP);
    if (typeof otplib.TOTP === 'function') {
        try {
            const totp = new otplib.TOTP();
            // In some versions of otplib, you might need to check if it's sync or async
            console.log('Attempting async generate...');
            const code = await totp.generate(secret);
            console.log('Generated TOTP (async):', code);
        } catch (e) {
            console.log('Async generate failed:', e.message);
        }

        try {
            console.log('Attempting generateSync...');
            const code = otplib.generateSync(secret);
            console.log('Generated TOTP (sync):', code);
        } catch (e) {
            console.log('Sync generate failed:', e.message);
        }
    }
}

test();
