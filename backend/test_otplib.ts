import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const otplib = require('otplib');

console.log('OTPLIB Keys:', Object.keys(otplib));
try {
    const secret = '7ZJGYOQ4UUYL6SKJU4SY4WMB6A';
    // Try using the generate function directly if it's there
    if (otplib.generate) {
        console.log('Using otplib.generate:', otplib.generate(secret));
    }
    // Try using TOTP class
    if (otplib.TOTP) {
        const totp = new otplib.TOTP();
        console.log('Using new TOTP().generate:', totp.generate(secret));
    }
} catch (e) {
    console.error('Test failed:', e);
}
