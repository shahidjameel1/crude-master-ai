import { SmartAPI, WebSocketV2 } from 'smartapi-javascript';
import { createRequire } from 'module';
import { MarketData } from '../types';
import dotenv from 'dotenv';

const customRequire = createRequire(import.meta.url);
const { authenticator } = customRequire('@otplib/preset-default');

dotenv.config();

export class AngelOneClient {
    private smartApi: any;
    private webSocket: any;
    private marketDataCallbacks: ((data: any) => void)[] = [];
    private isConnected: boolean = false;
    private feedToken: string | null = null;
    private jwtToken: string | null = null;
    private clientCode: string | null = null;
    private currentContract: any;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.smartApi = new SmartAPI({
            api_key: process.env.ANGEL_API_KEY || '',
        });
        this.currentContract = this.getActiveContract();
    }

    // ============================================
    // 1. CONTRACT MANAGEMENT SYSTEM
    // ============================================
    private getActiveContract(date: Date = new Date()) {
        const day = date.getDate();
        const month = date.getMonth(); // 0 = January
        const year = date.getFullYear();

        // MCX Crude Oil contracts
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

        let contractMonth = month;
        let contractYear = year;

        // On/after 16th of month, switch to next month contract
        if (day >= 16) {
            contractMonth = (month + 1) % 12;
            if (contractMonth === 0) contractYear++;
        }

        const monthCode = monthNames[contractMonth];
        const yearCode = String(contractYear).slice(-2); // "26" for 2026
        const symbol = `CRUDEOIL${monthCode}${yearCode}`;

        return {
            month: monthCode,
            year: contractYear,
            tradingSymbol: symbol,
            instrumentToken: this.getTokenForContract(symbol),
            expiryDate: new Date(contractYear, contractMonth, 15).toISOString().split('T')[0],
            status: "active"
        };
    }

    private getTokenForContract(symbol: string): string {
        // Map contract symbols to Angel One instrument tokens
        // In reality this should be fetched from getScriptMaster
        const tokenMap: Record<string, string> = {
            "CRUDEOILJAN26": "265005", // Example JAN
            "CRUDEOILFEB26": "223901",
            "CRUDEOILMAR26": "223902",
            "CRUDEOILAPR26": "223903",
        };
        // Fallback to the one we successfully tested in fix if map not found, or use provided default
        return tokenMap[symbol] || "265005";
    }

    public async connect(): Promise<boolean> {
        try {
            const totpKey = process.env.ANGEL_TOTP_KEY;
            const clientCode = process.env.ANGEL_CLIENT_CODE;
            const password = process.env.ANGEL_PASSWORD;

            console.log('🔄 Angel One: Attempting connection with client:', clientCode);

            if (!totpKey || !clientCode || !password) {
                console.error('❌ Angel One: Missing credentials in .env');
                return false;
            }

            // Generate TOTP
            const totp = authenticator.generate(totpKey);
            console.log('🔄 Angel One: Generated TOTP');

            // Authenticate
            const data = await this.smartApi.generateSession(clientCode, password, totp);

            if (data.status) {
                console.log('✅ Angel One: Session generated successfully');
                this.isConnected = true;
                this.jwtToken = data.data.jwtToken;
                this.feedToken = data.data.feedToken;
                this.clientCode = data.data.clientCode;

                return true;
            } else {
                console.error('❌ Angel One: Session generation failed:', data.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Angel One: Connection exception:', error);
            return false;
        }
    }

    public startMarketDataStream() {
        if (!this.isConnected || !this.clientCode || !this.feedToken || !this.jwtToken) {
            console.log("AngelOne: Not connected, starting mock stream fallback");
            this.startMockStream();
            return;
        }

        this.subscribeToContract();
        this.setupContractSwitchCheck();
    }

    private subscribeToContract() {
        try {
            this.webSocket = new WebSocketV2({
                jwttoken: this.jwtToken!,
                apikey: process.env.ANGEL_API_KEY || '',
                clientcode: this.clientCode!,
                feedtype: 'json'
            });

            this.webSocket.connect().then(() => {
                console.log(`✅ Angel One: WebSocket Connected for ${this.currentContract.tradingSymbol}`);

                const request = {
                    correlationID: "abcde12345",
                    action: 1, // Subscribe
                    mode: 1,
                    exchangeType: 5, // MCX
                    tokens: [
                        this.currentContract.instrumentToken // Dynamic Token
                    ]
                };

                this.webSocket.send(request);

                this.webSocket.on('tick', (tickData: any) => {
                    this.marketDataCallbacks.forEach(cb => cb(this.transformTick(tickData)));
                });
            });
        } catch (err) {
            console.error("Angel One WS Error", err);
            this.startMockStream();
        }
    }

    private setupContractSwitchCheck() {
        this.checkInterval = setInterval(() => {
            const newContract = this.getActiveContract();
            if (newContract.tradingSymbol !== this.currentContract.tradingSymbol) {
                console.log(`📊 Auto-switching contract: ${this.currentContract.tradingSymbol} -> ${newContract.tradingSymbol}`);
                this.switchContract(newContract);
            }
        }, 600000); // Check every 10 minutes
    }

    private switchContract(newContract: any) {
        this.currentContract = newContract;
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = null;
        }
        this.subscribeToContract();
    }

    private transformTick(tick: any) {
        return {
            symbol: this.currentContract.tradingSymbol,
            price: tick.last_traded_price / 100,
            timestamp: new Date(tick.exchange_timestamp)
        };
    }

    private startMockStream() {
        console.log('⚠️ Using MOCK Data Stream');
        setInterval(() => {
            const mockTick = {
                symbol: this.currentContract ? this.currentContract.tradingSymbol : 'CRUDEOIL',
                price: 5200 + Math.random() * 20 - 10,
                timestamp: new Date()
            };
            this.marketDataCallbacks.forEach(cb => cb(mockTick));
        }, 1000);
    }

    public async fetchHistoricalData(timeframe: string): Promise<any[]> {
        if (!this.isConnected || !this.feedToken) {
            console.log("AngelOne: Not connected, returning mock history");
            return [];
        }

        try {
            const intervalMap: Record<string, string> = {
                '1m': 'ONE_MINUTE',
                '5m': 'FIVE_MINUTE',
                '15m': 'FIFTEEN_MINUTE',
                '60m': 'ONE_HOUR',
                '1D': 'ONE_DAY'
            };
            const interval = intervalMap[timeframe] || 'FIFTEEN_MINUTE';

            const toDate = new Date();
            const fromDate = new Date();
            const daysBack = timeframe === '1D' ? 90 : 5;
            fromDate.setDate(toDate.getDate() - daysBack);

            const format = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 16);

            const request = {
                exchange: "MCX",
                symboltoken: this.currentContract.instrumentToken,
                interval: interval,
                fromdate: format(fromDate),
                todate: format(toDate)
            };

            const data = await this.smartApi.getCandleData(request);

            if (data.status && data.data) {
                return data.data.map((c: any) => ({
                    time: new Date(c[0]).getTime() / 1000,
                    open: c[1],
                    high: c[2],
                    low: c[3],
                    close: c[4],
                    volume: c[5]
                }));
            } else {
                console.error("AngelOne History Error:", data.message);
                return [];
            }
        } catch (error) {
            console.error("AngelOne History Exception:", error);
            return [];
        }
    }

    public onMarketData(callback: (data: any) => void) {
        this.marketDataCallbacks.push(callback);
    }
}
