import express from "express";
import cors from "cors";
import WebSocket from "ws";
import { SmartAPI, WebSocketV2 } from "smartapi-javascript";
import dotenv from "dotenv";
import path from "path";
// Load .env from root directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

const app = express();

// 1. HTTP Security Headers
app.use(helmet());

// 2. Strict CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'], // Allow Frontend 5173/5174
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trade-Secret'],
    credentials: true
}));

// 3. Parameter Pollution Protection
app.use(hpp());

// 4. Rate Limiting (100 req per 15 min)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' })); // Body limit

// Import Security Controller
import { SecurityController } from './controllers/SecurityController';
// Import Chaos Engine
import { ChaosEngine } from './logic/ChaosEngine';

app.use(ChaosEngine.middleware);

/* ───────── SECURITY ROUTES ───────── */
app.post('/api/security/glass-mode', SecurityController.toggleGlassMode);
app.post('/api/security/kill', SecurityController.emergencyKill);
app.get('/api/security/heartbeat', SecurityController.heartbeat);
app.post('/api/security/reset', SecurityController.resetSystem); // Demo only

/* ───────── CONFIG ───────── */
const {
    ANGEL_API_KEY,
    ANGEL_CLIENT_CODE,
    ANGEL_PASSWORD,
    ANGEL_TOTP_KEY,
    TRADING_MODE, // PAPER, SHADOW, ASSISTED, LIVE
} = process.env;

// Enforce Mode Defaults
const CURRENT_MODE = (TRADING_MODE || 'PAPER').toUpperCase();
console.log(`🛡️ SYSTEM STARTING IN MODE: [ ${CURRENT_MODE} ]`);

let smartApi;
let wsClient;
let feedToken;
let jwtToken;

/* ───────── HELPERS ───────── */
function isMarketOpen() {
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const h = now.getHours();
    const day = now.getDay();

    // Market closed on weekends
    if (day === 0 || day === 6) return false;

    // MCX: 9 AM - 11:30 PM IST
    return h >= 9 && h < 23;
}

/* ───────── LOGIN ───────── */
async function initAngel() {
    try {
        console.log('🔄 Initializing Angel One connection...');
        console.log('📋 API Key:', ANGEL_API_KEY ? `${ANGEL_API_KEY.substring(0, 4)}****` : 'MISSING');
        console.log('📋 Client Code:', ANGEL_CLIENT_CODE);

        smartApi = new SmartAPI({ api_key: ANGEL_API_KEY });

        // Generate TOTP
        const { authenticator } = await import('@otplib/preset-default');
        const totp = authenticator.generate(ANGEL_TOTP_KEY);

        console.log('🔐 TOTP generated:', totp);
        console.log('🔄 Calling generateSession...');

        const session = await smartApi.generateSession(
            ANGEL_CLIENT_CODE,
            ANGEL_PASSWORD,
            totp
        );

        // console.log('📦 Raw Session Response:', JSON.stringify(session, null, 2)); // REMOVED FOR SECURITY

        if (session.status && session.data) {
            feedToken = session.data.feedToken;
            jwtToken = session.data.jwtToken;
            console.log('✅ Angel One Logged In Successfully');
            console.log('🎫 Feed Token:', feedToken ? 'Received' : 'Missing');
            console.log('🔑 JWT Token:', jwtToken ? 'Received' : 'Missing');
            console.log('👤 User ID:', session.data.clientcode || 'N/A');

            if (isMarketOpen()) {
                console.log('🟢 Market is OPEN - Starting WebSocket');
                initWS();
            } else {
                console.log('🔴 Market is CLOSED - WebSocket will not start');
            }
        } else {
            console.error('❌ Angel One Login Failed');
            console.error('📦 Response:', JSON.stringify(session, null, 2));
            console.error('💬 Message:', session.message || 'No message');
            console.error('⚠️ Error Code:', session.errorcode || 'No error code');
        }
    } catch (error) {
        console.error('❌ Angel One Init Error:', error);
        console.error('📦 Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

initAngel();

/* ───────── FRONTEND WS ───────── */
const wss = new WebSocket.Server({ port: 3001 });
const clients = new Set();

wss.on("connection", ws => {
    console.log('👤 Frontend client connected');
    clients.add(ws);

    // Send market status on connect
    ws.send(JSON.stringify({
        type: 'MARKET_STATUS',
        isOpen: isMarketOpen()
    }));

    ws.on("close", () => {
        console.log('👤 Frontend client disconnected');
        clients.delete(ws);
    });
});

// Heartbeat Loop (30s)
setInterval(() => {
    broadcast({ type: 'PING', timestamp: Date.now() });
}, 30000);

function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(message);
        }
    });
}

console.log('🌐 Frontend WebSocket server running on port 3001');

/* ───────── ANGEL WS (LTP ONLY) ───────── */
function initWS() {
    try {
        wsClient = new WebSocketV2({
            jwttoken: jwtToken,
            apikey: ANGEL_API_KEY,
            clientcode: ANGEL_CLIENT_CODE,
            feedtype: feedToken,
        });

        wsClient.connect().then(() => {
            console.log('✅ Angel One WebSocket connected');

            // Subscribe to CRUDEOIL 19 FEB 2026 Futures using fetchData (V2 protocol)
            wsClient.fetchData({
                correlationId: "crude_live",
                action: 1, // Subscribe
                mode: 1,   // LTP
                exchangeType: 5, // MCX
                tokens: ["467013"] // CRUDEOIL 19 FEB 2026
            });

            wsClient.on("tick", tick => {
                const ltp = tick.last_traded_price / 100; // Adjust divisor if needed

                broadcast({
                    type: "PRICE_UPDATE",
                    data: {
                        price: Math.round(ltp),
                        volume: tick.volume_trade_for_the_day,
                        timestamp: Date.now(),
                        time: Math.floor(Date.now() / 1000)
                    }
                });
            });
        }).catch(err => {
            console.error('❌ Angel One WebSocket Error:', err);
        });
    } catch (error) {
        console.error('❌ WebSocket Init Error:', error);
    }
}

/* ───────── HISTORICAL CANDLES ───────── */
app.get("/api/candles", async (req, res) => {
    try {
        console.log('\n🔍 ===== CANDLES API REQUEST =====');

        // Check if smartApi is initialized
        if (!smartApi) {
            console.error('❌ smartApi is not initialized');
            return res.status(500).json({ error: 'Angel One not connected' });
        }

        const { timeframe = '15m' } = req.query;
        console.log('📊 Requested Timeframe:', timeframe);

        // Map timeframes to Angel One intervals
        const intervalMap: Record<string, string> = {
            '1m': 'ONE_MINUTE',
            '5m': 'FIVE_MINUTE',
            '15m': 'FIFTEEN_MINUTE',
            '1h': 'ONE_HOUR',
            '1D': 'ONE_DAY'
        };

        const interval = intervalMap[timeframe as string] || 'FIFTEEN_MINUTE';
        console.log('⏱️  Angel One Interval:', interval);

        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - (timeframe === '1D' ? 90 : 5));

        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        };

        const fromDateStr = formatDate(fromDate);
        const toDateStr = formatDate(toDate);

        console.log('📅 Date Range:', fromDateStr, '→', toDateStr);
        console.log('🏢 Exchange: MCX');
        console.log('🎫 Symbol Token: 467013 (CRUDEOIL 19 FEB 2026)');

        console.log('\n🔄 Calling smartApi.getCandleData...');

        const params = {
            exchange: "MCX",
            symboltoken: "467013", // CRUDEOIL 19 FEB 2026
            interval: interval,
            fromdate: fromDateStr,
            todate: toDateStr,
        };

        console.log('📦 Request Params:', JSON.stringify(params, null, 2));

        const candles = await smartApi.getCandleData(params);

        console.log('\n📦 Raw Angel One Response:', JSON.stringify(candles, null, 2));
        console.log('✅ Response Status:', candles.status);
        console.log('📊 Response Message:', candles.message || 'No message');
        console.log('📈 Data Length:', candles.data ? candles.data.length : 0);

        if (candles.status && candles.data && Array.isArray(candles.data) && candles.data.length > 0) {
            console.log('✅ Successfully received', candles.data.length, 'candles');
            console.log('📊 First Candle:', candles.data[0]);
            console.log('📊 Last Candle:', candles.data[candles.data.length - 1]);

            const formattedCandles = candles.data.map((c: any) => ({
                time: Math.floor(new Date(c[0]).getTime() / 1000),
                open: Math.round(c[1]),
                high: Math.round(c[2]),
                low: Math.round(c[3]),
                close: Math.round(c[4]),
                volume: c[5],
            }));

            console.log('✅ Formatted', formattedCandles.length, 'candles');
            console.log('📊 Sample Formatted Candle:', formattedCandles[0]);

            res.json({
                candles: formattedCandles,
                contract: 'CRUDEOIL 19 FEB 2026',
                expiry: '2026-02-19'
            });
        } else {
            console.error('❌ No candle data received or invalid response');
            console.error('📦 Full Response:', JSON.stringify(candles, null, 2));
            res.status(500).json({
                error: 'No candle data available',
                details: candles.message || 'Unknown error',
                response: candles
            });
        }
    } catch (error: any) {
        console.error('\n❌ ===== CANDLES API ERROR =====');
        console.error('💥 Error Type:', error.constructor.name);
        console.error('💬 Error Message:', error.message);
        console.error('📦 Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('🔍 Stack Trace:', error.stack);

        res.status(500).json({
            error: error.message,
            type: error.constructor.name,
            details: error
        });
    }
});

/* ───────── MARKET STATUS ───────── */
app.get("/api/market/status", (req, res) => {
    res.json({
        isOpen: isMarketOpen(),
        timestamp: Date.now()
    });
});

/* ───────── ACTIVE CONTRACT ───────── */
app.get("/api/contract/active", (req, res) => {
    res.json({
        symbol: 'CRUDEOIL19FEB26',
        displayName: 'CRUDEOIL 19 FEB 2026',
        token: '265005',
        expiry: '2026-02-19',
        exchange: 'MCX'
    });
});

const PORT = 3002;

/* ───────── INTENT FIREWALL (EXECUTION GUARD) ───────── */
app.post("/api/trade", (req, res) => {
    console.log('\n🛡️ ===== INTENT FIREWALL ACTIVATED =====');
    const { symbol, side, type, quantity, score, timestamp, secret_token } = req.body;

    console.log(`📥 Intent Received: ${side} ${symbol} x ${quantity}`);
    console.log(`📊 Score: ${score}`);

    // 0. AUTH & SECURITY GUARD
    const passedSecret = req.headers['x-trade-secret'] || secret_token;
    if (passedSecret !== process.env.TRADE_SECRET) {
        console.error(`🛑 BLOCKED: Invalid Trade Secret`);
        return res.status(403).json({
            status: 'BLOCKED',
            reason: 'UNAUTHORIZED',
            message: 'Invalid credentials.'
        });
    }

    const securityCheck = SecurityController.isTradingAllowed();
    if (!securityCheck.allowed) {
        console.error(`🛑 BLOCKED: Security Restriction - ${securityCheck.reason}`);
        return res.status(403).json({
            status: 'BLOCKED',
            reason: 'SECURITY_LOCK',
            message: securityCheck.reason
        });
    }

    // 1. CONTRACT GUARD (Backend Authority)
    // ONLY CRUDEOILM is allowed for automation/trading.
    if (symbol !== 'CRUDEOILM') {
        console.error(`🛑 BLOCKED: Unauthorized Contract ${symbol}`);
        return res.status(403).json({
            status: 'BLOCKED',
            reason: 'CONTRACT_VIOLATION',
            message: 'Only CRUDEOILM is authorized for trading.'
        });
    }

    // 2. INTELLIGENCE GUARD (Score Threshold)
    // Master Formula requires Score >= 85
    if (score < 85) {
        console.error(`🛑 BLOCKED: Insufficient Score ${score} < 85`);
        return res.status(403).json({
            status: 'BLOCKED',
            reason: 'SCORE_VIOLATION',
            message: 'Opportunity Score below 85 threshold.'
        });
    }

    // 3. DATA FRESHNESS GUARD
    // Reject if intent is > 2 seconds old (Network Latency Rejection)
    const now = Date.now();
    if (now - timestamp > 2000) {
        console.error(`🛑 BLOCKED: Stale Intent (${now - timestamp}ms delay)`);
        return res.status(408).json({
            status: 'BLOCKED',
            reason: 'LATENCY_VIOLATION',
            message: 'Intent timestamp stale. Network lag detected.'
        });
    }

    // 4. EXECUTION GATE (Mode Switch)
    console.log(`✅ FIREWALL PASSED. MODE: ${CURRENT_MODE}`);

    if (CURRENT_MODE === 'SHADOW') {
        console.log('👻 SHADOW MODE: Trade logged but NOT executed.');
        return res.json({
            status: 'SHADOW_LOGGED',
            message: 'Trade recorded in shadow ledger.',
            timestamp: Date.now()
        });
    }

    if (CURRENT_MODE === 'PAPER') {
        console.log('📝 PAPER MODE: Simulating execution internally.');
        setTimeout(() => {
            res.json({
                status: 'EXECUTED_PAPER',
                orderId: `PAPER-${Date.now()}`,
                executionPrice: 6000 + Math.random() * 10,
                timestamp: Date.now()
            });
        }, 200);
        return;
    }

    if (CURRENT_MODE === 'ASSISTED') {
        // In assisted mode, the user *already* confirmed via frontend.
        // Effectively same as LIVE but requires that manual trigger we just received.
        // We might verify "User Signature" here if we had one.
        console.log('🤝 ASSISTED MODE: Executing real trade with user consent.');
    }

    if (CURRENT_MODE === 'LIVE' || CURRENT_MODE === 'ASSISTED') {
        console.log('🚀 LIVE EXECUTION: Sending to Angel One...');
        // TODO: Uncomment when ready for real money
        // await smartApi.placeOrder({...});

        // Mocking live for now until smartApi is fully wired with real money constraints
        setTimeout(() => {
            res.json({
                status: 'EXECUTED_LIVE',
                orderId: `LIVE-${Date.now()}`,
                executionPrice: 6000 + Math.random() * 10,
                timestamp: Date.now()
            });
        }, 500);
        return;
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/candles`);
    console.log(`🔌 WebSocket: ws://localhost:3001`);
});
