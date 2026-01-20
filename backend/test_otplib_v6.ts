import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const otplib = require('otplib');

const secret = '7ZJGYOQ4UUYL6SKJU4SY4WMB6A';

console.log('Keys:', Object.keys(otplib));

try {
    // Some versions of otplib in CJS environment might benefit from this:
    const authenticator = otplib.authenticator || otplib;
    console.log('Attempting authenticator.generate(secret)...');
    const code = authenticator.generate(secret);
    console.log('Result:', code);
} catch (e) {
    console.log('Error:', e.message);
}

try {
    console.log('Attempting otplib.totp.generate(secret)...');
    const code = otplib.totp.generate(secret);
    console.log('Result:', code);
} catch (e) {
    console.log('Error:', e.message);
}
