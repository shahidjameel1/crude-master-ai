import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
    const { authenticator } = require('otplib');
    console.log('Successfully required authenticator from otplib');
    console.log('Code:', authenticator.generate('7ZJGYOQ4UUYL6SKJU4SY4WMB6A'));
} catch (e) {
    console.log('Failed to require authenticator from otplib:', e.message);
}

try {
    const { totp } = require('otplib');
    console.log('Successfully required totp from otplib');
    console.log('Code:', totp.generate('7ZJGYOQ4UUYL6SKJU4SY4WMB6A'));
} catch (e) {
    console.log('Failed to require totp from otplib:', e.message);
}

try {
    const otplib = require('otplib');
    const code = otplib.generateSync('7ZJGYOQ4UUYL6SKJU4SY4WMB6A');
    console.log('Code via otplib.generateSync:', code);
} catch (e) {
    console.log('Failed via otplib.generateSync:', e.message);
}
