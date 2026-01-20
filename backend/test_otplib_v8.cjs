const { authenticator } = require('otplib');
const secret = '7ZJGYOQ4UUYL6SKJU4SY4WMB6A';
try {
    const code = authenticator.generate(secret);
    console.log('Code:', code);
} catch (e) {
    console.log('Error:', e.message);
}
