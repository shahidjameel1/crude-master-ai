import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const otplib = require('otplib');

console.log('OTPLIB Keys:', Object.keys(otplib));
try {
    const secret = '7ZJGYOQ4UUYL6SKJU4SY4WMB6A';

    // Check if generate exists
    if (typeof otplib.generate === 'function') {
        console.log('otplib.generate exists');
        // otplib.generate often takes (secret, options)
        const code = otplib.generate(secret);
        console.log('Generated code via otplib.generate:', code);
    } else {
        console.log('otplib.generate is NOT a function, it is:', typeof otplib.generate);
    }

    // Check TOTP
    if (otplib.TOTP) {
        console.log('otplib.TOTP exists');
        const totp = new otplib.TOTP();
        const code = totp.generate(secret);
        console.log('Generated code via new TOTP().generate:', code);
    }
} catch (e) {
    console.error('Test failed:', e);
}
