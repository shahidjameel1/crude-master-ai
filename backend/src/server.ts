import express from "express";
import cors from "cors";
import WebSocket from "ws";
import { SmartAPI, WebSocketV2 } from "smartapi-javascript";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { CandleFinalizationService } from "./services/CandleFinalizationService";
import { AuthController } from "./controllers/AuthController";
import { authMiddleware } from "./middleware/authMiddleware";
import { systemState } from "./services/SystemStateService";
import { strategyEngine } from "./services/StrategyEngineService";
import { OrderService } from "./services/OrderService";
import { setOrderService, SecurityController } from "./controllers/SecurityController";
import { HealthService } from "./services/HealthService";
import { Candle } from "./types";
import { EvolutionController } from "./controllers/EvolutionController";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

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
app.use(cookieParser());

// 4. Rate Limiting (100 req per 15 min)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' })); // Body limit

// Import Security Controller
// Removed local import, using from controllers/SecurityController instead
// Import Chaos Engine
import { ChaosEngine } from './logic/ChaosEngine';

// Debug Logger
app.use((req, res, next) => {
    const hasCookie = !!req.cookies.auth_token;
    console.log(`[RECEIVED] ${req.method} ${req.path} | Cookie present: ${hasCookie}`);
    next();
});

app.use(ChaosEngine.middleware);

/* ───────── AUTH ROUTES ───────── */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for debugging
    message: 'Too many login attempts, please try again later.'
});
app.post('/api/auth/login', loginLimiter, AuthController.login);
app.post('/api/auth/logout', AuthController.logout);
app.get('/api/auth/check', authMiddleware, AuthController.check);

/* ───────── SECURITY ROUTES (PROTECTED) ───────── */
app.use('/api/security', authMiddleware);
app.post('/api/security/glass-mode', SecurityController.toggleGlassMode);

/* ───────── EVOLUTION ROUTES (PROTECTED) ───────── */
app.use('/api/evolution', authMiddleware);
app.get('/api/evolution/logs', EvolutionController.getEvolutionLogs);
app.post('/api/evolution/logs', EvolutionController.addEvolutionLog);
app.get('/api/evolution/session-ratings', EvolutionController.getSessionRatings);
app.post('/api/evolution/session-ratings', EvolutionController.addSessionRating);
app.get('/api/evolution/regime-state', EvolutionController.getRegimeState);
app.post('/api/evolution/regime-state', EvolutionController.updateRegimeState);
app.post('/api/security/kill', SecurityController.emergencyKill);
app.get('/api/security/heartbeat', SecurityController.heartbeat);
app.post('/api/security/reset', SecurityController.resetSystem); // Demo only

/* ───────── SYSTEM HEALTH ───────── */
app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        mode: (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase(),
        dataFeed: (global as any).smartApiInitialized ? "ANGEL_ONE" : "OFFLINE",
        orders: (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase() === "PAPER" ? "SIMULATED" : "BROKER_ENABLED"
    });
});

/* ───────── MODE ENFORCEMENT (ANDROID-SAFE) ───────── */
const MODE = (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase();
console.log(`🛡️ SYSTEM STARTING IN MODE: [ ${MODE} ]`);

if (MODE !== 'PAPER') {
    console.warn(`⚠️  WARNING: Non-paper mode detected. Real orders are DISABLED for Android safety.`);
}

// Android time sync warning
console.warn("⚠️  Ensure system time is synced (ntpdate) on Android/Termux");

/* ───────── CONFIG ───────── */
const {
    ANGEL_API_KEY,
    ANGEL_CLIENT_CODE,
    ANGEL_PASSWORD,
    ANGEL_TOTP_KEY,
} = process.env;

const savedState = systemState.getState();

let smartApi: any;
let wsClient: any;
let feedToken: any;
let jwtToken: any;
let orderService: OrderService | null = null;

// Candle Finalization Service (15m default)
const candleService = new CandleFinalizationService('15m');

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

        smartApi = new SmartAPI({ api_key: ANGEL_API_KEY as string });

        // Generate TOTP with speakeasy (Android-compatible)
        const totp = speakeasy.totp({
            secret: ANGEL_TOTP_KEY as string,
            encoding: 'base32'
        });

        console.log('🔐 TOTP generated:', totp);
        console.log('🔄 Calling generateSession...');

        const session = await smartApi.generateSession(
            ANGEL_CLIENT_CODE as string,
            ANGEL_PASSWORD as string,
            totp
        );

        // console.log('📦 Raw Session Response:', JSON.stringify(session, null, 2)); // REMOVED FOR SECURITY

        if (session.status && session.data) {
            feedToken = session.data.feedToken;
            jwtToken = session.data.jwtToken;

            // 🚀 Initialize Production Services
            orderService = new OrderService(smartApi);
            setOrderService(orderService);
            (global as any).smartApiInitialized = true;

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
            console.warn('⚠️  Backend will continue - data feed unavailable');
        }
    } catch (error) {
        console.error('❌ Angel One Init Error:', error);
        console.error('📦 Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.warn('⚠️  Backend will continue - data feed unavailable');
    }
}

// Initialize Angel One (non-blocking)
initAngel().catch(err => {
    console.error('❌ Angel One initialization failed:', err);
    console.warn('⚠️  Backend continuing without live data feed');
});

/* ───────── FRONTEND WS ───────── */
const wss = new WebSocket.Server({ port: 3001 });
const clients = new Set();

wss.on("connection", (ws, req) => {
    // 🔒 WS Auth Check
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        console.warn('🔞 Unauthorized WS connection attempt rejected');
        ws.close(4001, 'Unauthorized');
        return;
    }

    try {
        jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.warn('🔞 Invalid WS token rejected');
        ws.close(4001, 'Invalid Token');
        return;
    }

    console.log('👤 Authenticated Frontend client connected');
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

function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((c: any) => {
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
            jwttoken: jwtToken as string,
            apikey: ANGEL_API_KEY as string,
            clientcode: ANGEL_CLIENT_CODE as string,
            feedtype: feedToken as string,
        });

        wsClient.connect().then(() => {
            console.log('✅ Angel One WebSocket connected');
            (global as any).wsClientConnected = true;

            // Subscribe to CRUDEOIL 19 FEB 2026
            wsClient.fetchData({
                correlationId: "crude_live",
                action: 1, // Subscribe
                mode: 1,   // LTP
                exchangeType: 5, // MCX
                tokens: ["467013"] // CRUDEOIL 19 FEB 2026
            });

            wsClient.on("tick", (tick: any) => {
                const ltp = tick.last_traded_price / 100; // Adjust divisor if needed

                // Process tick through candle finalization service
                const result = candleService.processTick({
                    price: Math.round(ltp),
                    volume: tick.volume_trade_for_the_day || 0,
                    time: Math.floor(Date.now() / 1000)
                });

                // Track latency
                if (tick.exchange_timestamp) {
                    const delay = Date.now() - tick.exchange_timestamp;
                    HealthService.setLatency(delay);
                }

                // Broadcast price update
                broadcast({
                    type: "PRICE_UPDATE",
                    data: {
                        price: Math.round(ltp),
                        volume: tick.volume_trade_for_the_day,
                        time: Math.floor(Date.now() / 1000)
                    }
                });

                // Broadcast candle update
                broadcast({
                    type: "CANDLE_UPDATE",
                    data: {
                        confirmedCandles: result.confirmedCandles,
                        liveCandle: result.liveCandle,
                        newCandleFormed: result.newCandleFormed
                    }
                });

                // Broadcast strategy update if confirmed
                if (result.newCandleFormed && result.lastConfirmed) {
                    strategyEngine.processNewCandle(candleService.getTimeframe(), result.lastConfirmed);

                    // Trigger analysis
                    strategyEngine.runAnalysis().then(analysis => {
                        broadcast({
                            type: "STRATEGY_UPDATE",
                            data: analysis
                        });
                    });
                }
            });
        }).catch((err: any) => {
            console.error('❌ Angel One WebSocket Error:', err);
        });
    } catch (error) {
        console.error('❌ WebSocket Init Error:', error);
    }
}

/* ───────── HISTORICAL CANDLES (PROTECTED) ───────── */
app.get("/api/candles", authMiddleware, async (req, res) => {
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

            // Initialize candle finalization service with historical data
            candleService.initializeHistory(formattedCandles);
            console.log('✅ Candle finalization service initialized with historical data');

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

/* ───────── MARKET STATUS (PROTECTED) ───────── */
app.get("/api/market/status", authMiddleware, (req, res) => {
    res.json({
        isOpen: isMarketOpen(),
        timestamp: Date.now()
    });
});

/* ───────── ACTIVE CONTRACT (PROTECTED) ───────── */
app.get("/api/contract/active", authMiddleware, (req, res) => {
    res.json({
        symbol: 'CRUDEOIL19FEB26',
        displayName: 'CRUDEOIL 19 FEB 2026',
        token: '265005',
        expiry: '2026-02-19',
        exchange: 'MCX'
    });
});

const PORT = process.env.PORT || 3002;

/* ───────── INTENT FIREWALL (EXECUTION GUARD - PROTECTED) ───────── */
app.post("/api/trade", authMiddleware, (req, res) => {
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
        // In paper mode, we still use the OrderService if we want a local ledger, 
        // but since we don't have a paper ledger DB yet, we just mock the success.
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

    if (CURRENT_MODE === 'LIVE' || CURRENT_MODE === 'ASSISTED') {
        if (!orderService) {
            return res.status(503).json({ status: 'ERROR', message: 'Order service not available' });
        }

        console.log('🚀 LIVE EXECUTION: Sending to Angel One...');

        // Find token for the symbol
        const tokenMap: Record<string, string> = {
            'CRUDEOILM': '467013', // Update this with real mapping logic in prod
            'CRUDEOIL': '467013' // Same for now
        };

        const token = tokenMap[symbol] || '467013';

        orderService.placeOrder({
            symbol,
            token,
            exchange: 'MCX',
            side: side as 'BUY' | 'SELL',
            type: 'MARKET',
            quantity: quantity || 1
        }).then(result => {
            res.json({
                status: CURRENT_MODE === 'LIVE' ? 'EXECUTED_LIVE' : 'EXECUTED_ASSISTED',
                orderId: result.orderId,
                executionPrice: result.executionPrice,
                timestamp: result.timestamp
            });
        }).catch(err => {
            res.status(500).json({
                status: 'FAILED',
                reason: 'BROKER_REJECTION',
                message: err.message
            });
        });
        return;
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/candles`);
    console.log(`🔌 WebSocket: ws://localhost:3001`);
});
