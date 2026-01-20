import { create } from 'zustand';
import { CandlestickData } from 'lightweight-charts';

// --- TYPES ---

export type MarketTrend = 'UP' | 'DOWN' | 'SIDEWAYS';
export type AutomationMode = 'OFF' | 'ASSIST' | 'AUTO';
export type AgentMode = 'OBSERVE' | 'SEARCH' | 'PREPARE' | 'STRIKE' | 'DEFENSIVE' | 'LOCKDOWN';
export type RiskStatus = 'SAFE' | 'RISKY';
export type ContractSymbol = 'CRUDEOILM' | 'CRUDEOIL';

export interface ContractConfig {
    symbol: ContractSymbol;
    name: string;
    multiplier: number;
    tickSize: number;
    exchange: string;
}

export interface Strategy {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    weight: number; // 0-100
}

export interface Trade {
    id: string;
    side: 'BUY' | 'SELL';
    entryPrice: number;
    exitPrice: number;
    size: number;
    pnl: number;
    rMultiple: number;
    timestamp: number;
    strategyId: string;
    wasRuleViolation: boolean;
}

vwapAlignment: number; // Location Quality
emaTrend: number;      // Trend Context
structure: number;     // Structure & Liquidity
momentum: number;      // Momentum Confirmation
timing: number;        // Timing & Session
riskQuality: number;   // Risk Quality
}

export interface TradeIntent {
    side: 'BUY' | 'SELL';
    price: number;
    suggestedSL: number;
    suggestedTP: number;
    riskAmount: number;
    confluenceSnapshot: number;
    scoreBreakdown: ConfluenceBreakdown;
    timestamp: number;
}

export interface Notification {
    id: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    message: string;
    timestamp: number;
}

export interface Drawing {
    id: string;
    type: 'TRENDLINE' | 'HORIZONTAL' | 'RECTANGLE' | 'FIBONACCI';
    points: { time: number; price: number }[];
    color: string;
}

export interface CockpitState {
    // Market State
    currentPrice: number;
    vwap: number;
    trend: MarketTrend;
    candles: CandlestickData[];
    sessionHigh: number;
    sessionLow: number;
    volumeProfile: { price: number; volume: number; color: string }[];
    activeView: ContractSymbol;
    defaultTrade: ContractSymbol;
    contracts: ContractConfig[];

    // Strategy State
    strategies: Strategy[];
    confluenceScore: number;
    breakdown: ConfluenceBreakdown;
    confluenceReasons: string[];

    // Risk State
    riskStatus: RiskStatus;
    maxDailyLoss: number;
    riskPerTrade: number; // Percentage
    maxTradesPerDay: number;
    isKillZone: boolean;
    accountSize: number;

    // Performance State
    tradeHistory: Trade[];
    equityCurve: { timestamp: number; balance: number }[];

    // Automation State
    automationMode: AutomationMode;
    agentMode: AgentMode;
    opportunityScore: number;
    pointsToday: number;
    targetPoints: number;
    stopLossPoints: number;
    searchState: {
        activeZone: string | null;
        waitingFor: string | null;
    };
    globalKillSwitch: boolean;

    // Operator State
    isAdmin: boolean;
    isAdminPanelOpen: boolean;
    isCovertMode: boolean;

    // UI State
    is3DMode: boolean;
    isInsightDrawerOpen: boolean;
    isStrategyCreatorOpen: boolean;
    activeTab: 'REVIEW' | 'EVOLUTION' | 'SETTINGS' | 'JOURNAL' | 'PERFORMANCE' | 'CALENDAR';
    activeTimeframe: string;
    systemLogs: string[];
    notifications: Notification[];
    pendingTrade: TradeIntent | null;
    drawings: Drawing[];
    activeDrawingTool: Drawing['type'] | null;
    rrVisualizer: { active: boolean; entry: number; sl: number; tp: number; side: 'BUY' | 'SELL' } | null;

    // Actions
    setMarketData: (data: Partial<CockpitState>) => void;
    updatePrice: (price: number, vwap: number, candles: CandlestickData[]) => void;
    toggleStrategy: (id: string) => void;
    updateStrategyWeight: (id: string, weight: number) => void;
    setAutomationMode: (mode: AutomationMode) => void;
    triggerKillSwitch: () => void;
    addLog: (msg: string) => void;
    pushNotification: (type: Notification['type'], message: string) => void;
    removeNotification: (id: string) => void;
    setUI: (data: Partial<CockpitState>) => void;
    toggleCovertMode: () => void;

    // Intent Actions
    requestTrade: (side: 'BUY' | 'SELL') => void;
    confirmTrade: () => void;
    cancelTrade: () => void;
    setContract: (symbol: ContractSymbol) => void;
    setDefaultTrade: (symbol: ContractSymbol) => void;
    updatePoints: (points: number) => void;
    setAgentMode: (mode: AgentMode) => void;
    setSearchState: (zone: string | null, waitingFor: string | null) => void;
}

// --- STORE ---

export const useStore = create<CockpitState>((set, get) => ({
    // Initial State
    currentPrice: 0,
    vwap: 0,
    trend: 'SIDEWAYS',
    candles: [],
    sessionHigh: 0,
    sessionLow: 0,
    volumeProfile: [],

    strategies: [
        { id: 'trend', name: 'Trend Context', description: 'HTF & LTF Alignment', enabled: true, weight: 20 },
        { id: 'location', name: 'Location Quality', description: 'VWAP / Zones', enabled: true, weight: 20 },
        { id: 'structure', name: 'Structure', description: 'Break+Retest / Sweeps', enabled: true, weight: 20 },
        { id: 'momentum', name: 'Momentum', description: 'Impulse / RSI', enabled: true, weight: 15 },
        { id: 'risk', name: 'Risk Quality', description: 'SL Size & R:R', enabled: true, weight: 15 },
        { id: 'timing', name: 'Timing', description: 'Session / Chop', enabled: true, weight: 10 }
    ],
    confluenceScore: 0,
    structure: 0,
    momentum: 0,
    timing: 0,
    riskQuality: 0
},
    confluenceReasons: [],

    riskStatus: 'SAFE',
    maxDailyLoss: 5000,
    riskPerTrade: 1,
    maxTradesPerDay: 5,
    isKillZone: false,
    accountSize: 500000, // 5 Lakhs default for MCX

    tradeHistory: [],
    equityCurve: [{ timestamp: Date.now(), balance: 500000 }],

    automationMode: 'OFF',
    agentMode: 'SEARCH',
    opportunityScore: 0,
    pointsToday: 0,
    targetPoints: 50,
    stopLossPoints: -20,
    searchState: {
    activeZone: null,
    waitingFor: null
},
    globalKillSwitch: false,

    isAdmin: true,
    isAdminPanelOpen: false,
    isCovertMode: false,

    is3DMode: false,
    isInsightDrawerOpen: false,
    isStrategyCreatorOpen: false,
    activeTab: 'REVIEW',
    activeTimeframe: '15m',
    systemLogs: [],
    notifications: [],
    pendingTrade: null,
    drawings: [],
    activeDrawingTool: null,
    rrVisualizer: null,

    activeView: 'CRUDEOILM',
    defaultTrade: 'CRUDEOILM',
    contracts: [
    { symbol: 'CRUDEOILM', name: 'CRUDEOIL MINI', multiplier: 10, tickSize: 1, exchange: 'MCX' },
    { symbol: 'CRUDEOIL', name: 'CRUDEOIL (BIG)', multiplier: 100, tickSize: 1, exchange: 'MCX' }
],

    // Actions
    setMarketData: (data) => set((state) => ({ ...state, ...data })),

    updatePrice: (price, vwap, candles) => set((state) => {
        const { strategies, sessionHigh, sessionLow } = get();
        const trend = price > vwap ? 'UP' : 'DOWN';

        const breakdownValues: ConfluenceBreakdown = {
            vwapAlignment: 0,
            emaTrend: 0,
            structure: 0,
            momentum: 0,
            timing: 0,
            riskQuality: 0
        };
        const reasons: string[] = [];

        // 1. Location Quality (20) - VWAP & Zones
        const locStrat = strategies.find(s => s.id === 'location');
        if (locStrat?.enabled) {
            if (price > vwap) { breakdownValues.vwapAlignment += 10; reasons.push("Loc: Above VWAP"); } // placeholder split
            const range = sessionHigh - sessionLow;
            if (range > 0 && price < sessionLow + (range * 0.4)) {
                breakdownValues.vwapAlignment += 10;
                reasons.push("Loc: Discount Zone");
            }
        }

        // 2. Trend Context (20) - HTF & LTF
        const trendStrat = strategies.find(s => s.id === 'trend');
        if (trendStrat?.enabled && price > vwap) {
            breakdownValues.emaTrend = trendStrat.weight; // Simplified placeholder
            reasons.push("Trend: Bullish Context");
        }

        // 3. Structure (20)
        const structStrat = strategies.find(s => s.id === 'structure');
        if (structStrat?.enabled) {
            // Mock structure logic
            breakdownValues.structure = 0;
        }

        // 4. Momentum (15)
        const momStrat = strategies.find(s => s.id === 'momentum');
        if (momStrat?.enabled && price > vwap) {
            breakdownValues.momentum = momStrat.weight;
            reasons.push("Mom: Positive Impulse");
        }

        // 5. Risk Quality (15)
        const riskStrat = strategies.find(s => s.id === 'risk');
        if (riskStrat?.enabled) {
            breakdownValues.riskQuality = riskStrat.weight; // Assume good risk for now
            reasons.push("Risk: Clean R:R");
        }

        // 6. Timing (10)
        const timingStrat = strategies.find(s => s.id === 'timing');
        if (timingStrat?.enabled) {
            const now = new Date();
            const h = now.getHours();
            if (h >= 14 && h <= 20) { // UK/US Session
                breakdownValues.timing = timingStrat.weight;
                reasons.push("Time: Active Session");
            } else if (h >= 12 && h < 14) {
                breakdownValues.timing = -10; // Lunch Chop Penalty
                reasons.push("Time: LUNCH CHOP");
            }
        }

        let score = Object.values(breakdownValues).reduce((a, b) => a + b, 0);
        score = Math.max(0, Math.min(100, score)); // Clamp 0-100

        // Master Logic: Determine Agent Mode based on score & points
        let nextAgentMode: AgentMode = 'SEARCH'; // Default SEARCH (<75)
        const points = get().pointsToday;
        const target = get().targetPoints;
        const stop = get().stopLossPoints;

        if (points <= stop) {
            nextAgentMode = 'LOCKDOWN';
        } else if (points >= target) {
            nextAgentMode = 'DEFENSIVE';
        } else if (score >= 85) {
            nextAgentMode = 'STRIKE';
        } else if (score >= 75) {
            nextAgentMode = 'PREPARE';
        } else if (score >= 60) {
            nextAgentMode = 'SEARCH'; // "WATCH/SEARCH"
        } else {
            nextAgentMode = 'OBSERVE'; // < 60
        }

        // Search State Logic
        let searchZone: string | null = null;
        let searchWait: string | null = null;

        if (nextAgentMode === 'SEARCH' || nextAgentMode === 'PREPARE') {
            searchZone = price < vwap ? "VWAP Discount" : "VWAP Premium";
            searchWait = nextAgentMode === 'PREPARE' ? "ARMED: Awaiting Trigger" : "Monitoring Structure";
        }

        return {
            ...state,
            currentPrice: price,
            vwap,
            candles,
            trend,
            confluenceScore: score,
            opportunityScore: score,
            breakdown: breakdownValues,
            confluenceReasons: reasons,
            agentMode: nextAgentMode,
            searchState: {
                activeZone: searchZone,
                waitingFor: searchWait
            }
        };
    }),

    toggleStrategy: (id) => set((state) => ({
        strategies: state.strategies.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    })),

    updateStrategyWeight: (id, weight) => set((state) => ({
        strategies: state.strategies.map(s => s.id === id ? { ...s, weight } : s)
    })),

    setAutomationMode: (mode) => {
        const { globalKillSwitch, addLog, pushNotification } = get();
        if (globalKillSwitch) {
            addLog("🛑 MODE CHANGE BLOCKED: System is perma-locked by Kill Switch.");
            pushNotification('ERROR', 'System Locked: EMERGENCY_HALT');
            return;
        }
        set({ automationMode: mode });
        addLog(`📩 MODE CHANGE: Automation set to ${mode}`);
        pushNotification(mode === 'AUTO' ? 'WARNING' : 'INFO', `Automation Mode: ${mode}`);
    },

    triggerKillSwitch: () => {
        set({ globalKillSwitch: true, automationMode: 'OFF' });
        get().addLog("🚨 EMERGENCY: GLOBAL KILL SWITCH TRIGGERED. ALL OPERATIONS HALTED.");
        get().pushNotification('ERROR', "GLOBAL KILL SWITCH ACTIVATED");
    },

    addLog: (msg) => set((state) => ({
        systemLogs: [...state.systemLogs.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]
    })),

    pushNotification: (type, message) => set((state) => ({
        notifications: [
            ...state.notifications,
            { id: Math.random().toString(36).substr(2, 9), type, message, timestamp: Date.now() }
        ]
    })),

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),

    setUI: (data) => set((state) => ({ ...state, ...data })),
    toggleCovertMode: () => set((state) => ({ isCovertMode: !state.isCovertMode })),

    requestTrade: (side) => {
        const { currentPrice, confluenceScore, globalKillSwitch, riskStatus, isKillZone, addLog, pushNotification, activeView, defaultTrade } = get();

        // 1. Contract Guard (Non-Negotiable)
        if (activeView !== defaultTrade) {
            addLog(`🛑 EXECUTION BLOCKED: ${activeView} is in VIEW ONLY mode. Locked default is ${defaultTrade}.`);
            pushNotification('ERROR', `Execution Blocked: Non-Default Contract`);
            return;
        }

        // 2. Decision Firewall
        const { agentMode, pointsToday, stopLossPoints } = get();
        if (globalKillSwitch || agentMode === 'LOCKDOWN') {
            addLog(`🛑 TRADE BLOCKED: ${agentMode === 'LOCKDOWN' ? 'Loss Stop Reached' : 'Kill Switch Active'}.`);
            pushNotification('ERROR', `Trade Blocked: ${agentMode === 'LOCKDOWN' ? 'Daily Loss Stop' : 'Kill Switch'}`);
            return;
        }

        const riskPerTrade = 2500; // Mock risk calculation based on 0.5% of 5L
        const atr = 5; // Mock ATR for SL/TP

        const intent: TradeIntent = {
            side,
            price: currentPrice,
            suggestedSL: side === 'BUY' ? currentPrice - (atr * 2) : currentPrice + (atr * 2),
            suggestedTP: side === 'BUY' ? currentPrice + (atr * 4) : currentPrice - (atr * 4),
            riskAmount: riskPerTrade,
            confluenceSnapshot: confluenceScore,
            scoreBreakdown: get().breakdown,
            timestamp: Date.now()
        };

        set({ pendingTrade: intent });
        addLog(`INTENT: Validating ${side} request for ${activeView} at ${currentPrice}...`);
    },

    setContract: (symbol) => set({ activeView: symbol }),

    setDefaultTrade: (symbol) => {
        const { addLog, pushNotification } = get();
        set({ defaultTrade: symbol });
        addLog(`🛡️ SECURITY: Default trading contract switched to ${symbol}`);
        pushNotification('WARNING', `Default Contract: ${symbol}`);
    },

    confirmTrade: async () => {
        const { pendingTrade, addLog, pushNotification } = get();
        if (!pendingTrade) return;

        try {
            addLog(`🚀 EXECUTION: Sending ${pendingTrade.side} Intent to Firewall...`);

            // @ts-ignore
            const tradeSecret = import.meta.env.VITE_TRADE_SECRET || '';

            const response = await fetch('http://localhost:3002/api/trade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trade-Secret': tradeSecret
                },
                body: JSON.stringify({
                    symbol: get().activeView,
                    side: pendingTrade.side,
                    type: 'MARKET',
                    quantity: 1, // Enforce logic here or backend
                    score: pendingTrade.confluenceSnapshot,
                    timestamp: pendingTrade.timestamp
                })
            });

            const result = await response.json();

            if (response.ok) {
                addLog(`✅ EXECUTION CONFIRMED: ${result.orderId} @ ${result.executionPrice}`);
                pushNotification('SUCCESS', 'Trade Executed Successfully');
            } else {
                addLog(`🛑 EXECUTION DENIED: ${result.reason} - ${result.message}`);
                pushNotification('ERROR', `Trade Rejected: ${result.reason}`);
            }
        } catch (error) {
            addLog(`💥 NETWORK ERROR: Could not reach Intent Firewall`);
            console.error(error);
        }

        set({ pendingTrade: null });
    },

    cancelTrade: () => {
        const { addLog } = get();
        addLog("📉 INTENT: Trade request discarded by operator.");
        set({ pendingTrade: null });
    },

    updatePoints: (points) => set((state) => ({ pointsToday: state.pointsToday + points })),
    setAgentMode: (mode) => set({ agentMode: mode }),
    setSearchState: (zone, waitingFor) => set({ searchState: { activeZone: zone, waitingFor } })
}));
