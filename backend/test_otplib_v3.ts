import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const otplib = require('otplib');

const secret = '7ZJGYOQ4UUYL6SKJU4SY4WMB6A';

console.log('TOTP Type:', typeof otplib.TOTP);
if (typeof otplib.TOTP === 'function') {
    // It's likely a class
    try {
        const totp = new otplib.TOTP({
            digits: 6,
            step: 30
        });
        console.log('Generated TOTP:', totp.generate(secret));
    } catch (e) {
        console.log('new TOTP() failed:', e.message);
    }
}

// Check if there is an authenticator property that might be hidden or on default
console.log('Default property exists:', !!otplib.default);
if (otplib.default) {
    console.log('Default keys:', Object.keys(otplib.default));
}
