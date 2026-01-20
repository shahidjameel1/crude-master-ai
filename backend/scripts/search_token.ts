import { SmartAPI } from "smartapi-javascript";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const {
    ANGEL_API_KEY,
    ANGEL_CLIENT_CODE,
    ANGEL_PASSWORD,
    ANGEL_TOTP_KEY,
} = process.env;

async function searchToken() {
    try {
        console.log('🔄 Initializing Angel One...');
        const smartApi = new SmartAPI({ api_key: ANGEL_API_KEY });

        const { authenticator } = await import('@otplib/preset-default');
        const totp = authenticator.generate(ANGEL_TOTP_KEY);

        console.log('🔐 Authenticating...');
        const session = await smartApi.generateSession(
            ANGEL_CLIENT_CODE,
            ANGEL_PASSWORD,
            totp
        );

        if (session.status) {
            console.log('✅ Logged in.');

            console.log('⏳ Waiting 2 seconds...');
            await new Promise(r => setTimeout(r, 2000));

            console.log('🔍 Searching for CRUDEOIL...');

            // Search for CRUDEOIL
            const response = await smartApi.searchScrip({
                "exchange": "MCX",
                "searchscrip": "CRUDEOIL"
            });

            let data: any[] = [];

            if (Array.isArray(response)) {
                console.log('📦 Response is Array');
                data = response;
            } else if (response.data && Array.isArray(response.data)) {
                console.log('📦 Response has .data Array');
                data = response.data;
            } else if (typeof response === 'object') {
                console.log('📦 Response is Object, trying Object.values...');
                const values = Object.values(response);
                if (values.length > 0 && values[0]?.symboltoken) {
                    console.log('📦 Object.values worked!');
                    data = values;
                }
            }

            if (data.length > 0) {
                console.log(`✅ Found ${data.length} results.`);

                // Filter for Standard CRUDEOIL Futures
                const standardCrude = data.filter((item: any) =>
                    item.exchange === 'MCX' &&
                    (item.instrumenttype === 'FUTCOM' || item.instrumenttype === 'FUTENR') &&
                    item.tradingsymbol.startsWith('CRUDEOIL') &&
                    !item.tradingsymbol.startsWith('CRUDEOILM')
                );

                console.log(`\n🔍 Found ${standardCrude.length} Standard CRUDEOIL Futures.`);

                console.log('--------------------------------------------------');
                console.log('SYMBOL           | TOKEN  | EXPIRY       | LOT');
                console.log('--------------------------------------------------');

                standardCrude
                    .sort((a: any, b: any) => new Date(a.expirydate).getTime() - new Date(b.expirydate).getTime())
                    .forEach((f: any) => {
                        console.log(`${f.tradingsymbol.padEnd(16)} | ${f.symboltoken.padEnd(6)} | ${f.expirydate.padEnd(12)} | ${f.lotsize}`);
                    });
                console.log('--------------------------------------------------');

            } else {
                console.log('❌ Failed to extract data from response.');
                console.log('Response Keys:', Object.keys(response));
                console.log('Response Status:', response.status);
                // console.log('Full Response:', JSON.stringify(response, null, 2));
            }

        } else {
            console.error('❌ Login Failed:', session.message);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

searchToken();
