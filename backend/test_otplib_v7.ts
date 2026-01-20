import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
    const { authenticator } = require('otplib');
    console.log('Authenticator found via main require');
    console.log('Code:', authenticator.generate('7ZJGYOQ4UUYL6SKJU4SY4WMB6A'));
} catch (e) {
    console.log('Main require failed:', e.message);
}

try {
    // This is the common ESM/CJS path for authenticator in v13
    const { authenticator } = require('@otplib/preset-default');
    console.log('Authenticator found via @otplib/preset-default');
    console.log('Code:', authenticator.generate('7ZJGYOQ4UUYL6SKJU4SY4WMB6A'));
} catch (e) {
    console.log('@otplib/preset-default failed:', e.message);
}
