import { create } from 'zustand';
import { CandlestickData } from 'lightweight-charts';

// --- TYPES ---

export type MarketTrend = 'UP' | 'DOWN' | 'SIDEWAYS';
export type AutomationMode = 'OFF' | 'ASSIST' | 'AUTO';
export type AgentMode = 'OBSERVE' | 'SEARCH' | 'PREPARE' | 'STRIKE' | 'DEFENSIVE' | 'LOCKDOWN';
export type AgentState = 'IDLE' | 'SEARCHING' | 'ANALYZING' | 'READY' | 'EXECUTING' | 'COOLDOWN' | 'ERROR';
export type RiskStatus = 'SAFE' | 'RISKY';
export type ContractSymbol = 'CRUDEOILM' | 'CRUDEOIL';
export type DiagnosticStatus = 'OK' | 'WARN' | 'FAIL' | 'STALE' | 'DOWN' | 'ACTIVE' | 'IDLE' | 'STALLED' | 'READY' | 'BLOCKED' | 'UNREACHABLE' | 'DEGRADED';

export interface SystemDiagnostics {
    auth: 'OK' | 'WARN' | 'FAIL';
    marketData: 'OK' | 'STALE' | 'DOWN';
    agent: 'ACTIVE' | 'IDLE' | 'STALLED';
    execution: 'READY' | 'BLOCKED';
    ui: 'OK' | 'DEGRADED';
    backend: 'HEALTHY' | 'DEGRADED' | 'UNSAFE';
    lastCheck: number;
}

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
export interface ConfluenceFactors {
    vwapAlignment: number; // Location Quality
    emaTrend: number;      // Trend Context
    structure: number;     // Structure & Liquidity
    momentum: number;      // Momentum Confirmation
    timing: number;        // Timing & Session
    riskQuality: number;   // Risk Quality
}

export interface ConfluenceBreakdown {
    vwapAlignment: number;
    emaTrend: number;
    structure: number;
    momentum: number;
    timing: number;
    riskQuality: number;
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
    // Timeline Data
    agentReasoning: { timestamp: number; state: string; reason: string; details?: string }[];
    confidenceDetail: { score: number; breakdown: Record<string, number> };
    checklistStatus: { passed: boolean; failedItems: string[] };

    // Intelligence Features
    tradeReplays: Array<{
        tradeId: string;
        entry: number;
        exit: number;
        result: 'WIN' | 'LOSS' | 'BREAKEVEN';
        confidenceAtEntry: number;
        strategyComponents: Record<string, number>;
        marketCondition: string;
        explanation: string;
    }>;
    patienceState: {
        isActive: boolean;
        cooldownUntil: number;
        reason: string;
        consecutiveLosses: number;
    };
    confidenceDecayState: {
        isDecaying: boolean;
        decayRate: number;
        lastValidSetup: number;
    };
    strategyProfiles: Array<{
        id: string;
        name: string;
        confidence: number;
        winRate: number;
        drawdown: number;
        marketSuitability: string;
    }>;
    activeStrategyId: string;

    // Market State
    currentPrice: number;
    vwap: number;
    trend: MarketTrend;
    candles: CandlestickData[]; // Legacy for backward compat
    confirmedCandles: CandlestickData[];
    liveCandle: CandlestickData | null;
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
    agentState: AgentState;
    agentReason: string;
    lastAgentAction: number; // Timestamp
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
    activeTab: 'REVIEW' | 'EVOLUTION' | 'SETTINGS' | 'JOURNAL' | 'PERFORMANCE' | 'CALENDAR' | 'CALENDAR';
    activeTimeframe: string;
    systemLogs: string[];
    notifications: Notification[];
    pendingTrade: TradeIntent | null;
    drawings: Drawing[];
    activeDrawingTool: Drawing['type'] | null;
    rrVisualizer: { active: boolean; entry: number; sl: number; tp: number; side: 'BUY' | 'SELL' } | null;
    isDrawerOpen: boolean;
    isNotificationDrawerOpen: boolean;
    chartStatus: 'LOADING' | 'READY' | 'ERROR';
    deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP';
    orientation: 'PORTRAIT' | 'LANDSCAPE';
    isQAPanelOpen: boolean;
    systemDiagnostics: SystemDiagnostics;

    // Performance & Health
    latencyMs: number;
    protocolVersion: string;
    brokerStatus: 'OK' | 'DOWN';
    feedStatus: 'OK' | 'DOWN';
    isMarketOpen: boolean;
    marketSession: string;

    // Auth State
    isAuthenticated: boolean;
    isAuthLoading: boolean;

    // System Status
    systemMode: 'PAPER' | 'LIVE';
    backendStatus: { status: string; dataFeed: string; orders: string };

    // Actions
    setMarketData: (data: Partial<CockpitState>) => void;
    updatePrice: (price: number, vwap: number) => void;
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
    setAgentState: (state: AgentState, reason: string) => void;
    setSearchState: (zone: string | null, waitingFor: string | null) => void;

    // Auth Actions
    setAuthenticated: (val: boolean) => void;
    setAuthLoading: (val: boolean) => void;
    fetchSystemStatus: () => Promise<void>;

    // Transparency Actions
    addReasoningLog: (state: string, reason: string, details?: string) => void;
    updateConfidence: (score: number, breakdown: Record<string, number>) => void;
    updateChecklistStatus: (passed: boolean, failedItems: string[]) => void;

    // Intelligence Actions
    addTradeReplay: (replay: any) => void;
    updatePatienceState: (state: Partial<CockpitState['patienceState']>) => void;
    updateConfidenceDecay: (state: Partial<CockpitState['confidenceDecayState']>) => void;
    addStrategyProfile: (profile: any) => void;
    setActiveStrategy: (id: string) => void;

    // Evolution Intelligence Actions
    evolutionLog: Array<{ timestamp: number; confirmation: string; oldWeight: number; newWeight: number; reason: string }>;
    sessionRatings: Array<{ sessionDate: number; overallScore: number; discipline: number; patience: number; signalQuality: number; executionTiming: number; riskAdherence: number; explanation: string }>;
    regimeState: { isNoTradeMode: boolean; reason: string; detectedAt: number | null };
    sessionProfile: 'ASIA' | 'LONDON' | 'NY';
    addEvolutionLog: (log: any) => void;
    addSessionRating: (rating: any) => void;
    updateRegimeState: (state: Partial<CockpitState['regimeState']>) => void;
    setSessionProfile: (profile: 'ASIA' | 'LONDON' | 'NY') => void;
    updateDiagnostics: (diagnostics: Partial<SystemDiagnostics>) => void;
}

// --- STORE ---

export const useStore = create<CockpitState>((set, get) => ({
    // Initial State
    isAuthenticated: false,
    isAuthLoading: true,
    currentPrice: 0,
    vwap: 0,
    trend: 'SIDEWAYS',
    candles: [],
    confirmedCandles: [],
    liveCandle: null,
    sessionHigh: 0,
    sessionLow: 0,
    volumeProfile: [],

    systemMode: 'PAPER',
    backendStatus: { status: 'OFFLINE', dataFeed: 'OFFLINE', orders: 'SIMULATED' },

    strategies: [
        { id: 'trend', name: 'Trend Context', description: 'HTF & LTF Alignment', enabled: true, weight: 20 },
        { id: 'location', name: 'Location Quality', description: 'VWAP / Zones', enabled: true, weight: 20 },
        { id: 'structure', name: 'Structure', description: 'Break+Retest / Sweeps', enabled: true, weight: 20 },
        { id: 'momentum', name: 'Momentum', description: 'Impulse / RSI', enabled: true, weight: 15 },
        { id: 'risk', name: 'Risk Quality', description: 'SL Size & R:R', enabled: true, weight: 15 },
        { id: 'timing', name: 'Timing', description: 'Session / Chop', enabled: true, weight: 10 }
    ],
    confluenceScore: 0,
    breakdown: {
        vwapAlignment: 0,
        emaTrend: 0,
        structure: 0,
        momentum: 0,
        timing: 0,
        riskQuality: 0
    },
    structure: 0,
    momentum: 0,
    timing: 0,
    riskQuality: 0,
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
    agentState: 'IDLE',
    agentReason: 'Initialising Friday-X...',
    lastAgentAction: Date.now(),
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

    // Transparency State
    agentReasoning: [],
    confidenceDetail: { score: 0, breakdown: {} },
    checklistStatus: { passed: true, failedItems: [] },

    // Intelligence State
    tradeReplays: [],
    patienceState: {
        isActive: false,
        cooldownUntil: 0,
        reason: '',
        consecutiveLosses: 0
    },
    confidenceDecayState: {
        isDecaying: false,
        decayRate: 0,
        lastValidSetup: Date.now()
    },
    strategyProfiles: [
        { id: 'strategy-a', name: 'Strategy A', confidence: 0, winRate: 0, drawdown: 0, marketSuitability: 'Trending' },
        { id: 'strategy-b', name: 'Strategy B', confidence: 0, winRate: 0, drawdown: 0, marketSuitability: 'Ranging' }
    ],
    activeStrategyId: 'strategy-a',

    // Evolution Intelligence (Session-Scoped)
    evolutionLog: [],
    sessionRatings: [],
    regimeState: { isNoTradeMode: false, reason: '', detectedAt: null },
    sessionProfile: 'NY', // Default to New York session

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

    isDrawerOpen: false,
    isNotificationDrawerOpen: false,
    chartStatus: 'LOADING',
    deviceType: 'DESKTOP',
    orientation: 'PORTRAIT',
    isQAPanelOpen: false,
    systemDiagnostics: {
        auth: 'FAIL',
        marketData: 'DOWN',
        agent: 'IDLE',
        execution: 'BLOCKED',
        ui: 'OK',
        backend: 'HEALTHY',
        lastCheck: Date.now()
    },

    latencyMs: 0,
    protocolVersion: 'FRIDAY-X V1.0',
    brokerStatus: 'OK',
    feedStatus: 'OK',
    isMarketOpen: false,
    marketSession: 'MCX',

    activeView: 'CRUDEOILM',
    defaultTrade: 'CRUDEOILM',
    contracts: [
        { symbol: 'CRUDEOILM', name: 'CRUDEOIL MINI', multiplier: 10, tickSize: 1, exchange: 'MCX' },
        { symbol: 'CRUDEOIL', name: 'CRUDEOIL (BIG)', multiplier: 100, tickSize: 1, exchange: 'MCX' }
    ],

    // Actions
    updatePrice: (price, vwap) => set((state) => {
        const trend = price > vwap ? 'UP' : 'DOWN';

        // Strategy logic removed from here as per safety rules.
        // updatePrice now only handles real-time price/vwap tracking.

        return {
            ...state,
            currentPrice: price,
            vwap,
            trend
        };
    }),

    // New action to process finalized candles and run strategy logic
    setMarketData: (data) => set((state) => {
        const newState = { ...state, ...data };

        // If we are updating candles, recalculate strategy score based on CONFIRMED data only
        if (data.confirmedCandles) {
            const confirmedCandles = data.confirmedCandles as CandlestickData[];
            if (confirmedCandles.length > 0) {
                const lastConfirmed = confirmedCandles[confirmedCandles.length - 1];
                const { strategies, sessionHigh, sessionLow } = newState;

                const breakdownValues: ConfluenceBreakdown = {
                    vwapAlignment: 0,
                    emaTrend: 0,
                    structure: 0,
                    momentum: 0,
                    timing: 0,
                    riskQuality: 0
                };
                const reasons: string[] = [];

                // 1. Location Quality - BASED ON CONFIRMED CLOSE
                const locStrat = strategies.find(s => s.id === 'location');
                if (locStrat?.enabled) {
                    if (lastConfirmed.close > newState.vwap) {
                        breakdownValues.vwapAlignment += 10;
                        reasons.push("Loc: Above VWAP (Confirmed)");
                    }
                    const range = sessionHigh - sessionLow;
                    if (range > 0 && lastConfirmed.close < sessionLow + (range * 0.4)) {
                        breakdownValues.vwapAlignment += 10;
                        reasons.push("Loc: Discount Zone (Confirmed)");
                    }
                }

                // 2. Trend Context - BASED ON CONFIRMED CLOSE
                const trendStrat = strategies.find(s => s.id === 'trend');
                if (trendStrat?.enabled && lastConfirmed.close > newState.vwap) {
                    breakdownValues.emaTrend = trendStrat.weight;
                    reasons.push("Trend: Bullish Context (Confirmed)");
                }

                // 3. Momentum - BASED ON CONFIRMED CLOSE
                const momStrat = strategies.find(s => s.id === 'momentum');
                if (momStrat?.enabled && lastConfirmed.close > lastConfirmed.open) {
                    breakdownValues.momentum = momStrat.weight;
                    reasons.push("Mom: Positive Close (Confirmed)");
                }

                // 4. Timing
                const timingStrat = strategies.find(s => s.id === 'timing');
                if (timingStrat?.enabled) {
                    const now = new Date();
                    const h = now.getHours();
                    if (h >= 14 && h <= 20) {
                        breakdownValues.timing = timingStrat.weight;
                        reasons.push("Time: Active Session");
                    }
                }

                let score = Object.values(breakdownValues).reduce((a, b) => a + b, 0);
                score = Math.max(0, Math.min(100, score));

                // Determine Agent Mode
                let nextAgentMode: AgentMode = 'SEARCH';
                const points = newState.pointsToday;
                const target = newState.targetPoints;
                const stop = newState.stopLossPoints;

                if (points <= stop) {
                    nextAgentMode = 'LOCKDOWN';
                } else if (points >= target) {
                    nextAgentMode = 'DEFENSIVE';
                } else if (score >= 85) {
                    nextAgentMode = 'STRIKE';
                } else if (score >= 75) {
                    nextAgentMode = 'PREPARE';
                } else if (score >= 60) {
                    nextAgentMode = 'SEARCH';
                } else {
                    nextAgentMode = 'OBSERVE';
                }

                newState.confluenceScore = score;
                newState.opportunityScore = score;
                newState.breakdown = breakdownValues;
                newState.confluenceReasons = reasons;
                newState.agentMode = nextAgentMode;

                // Agent State Transitions (Autonomous Logic)
                const currentAgentState = state.agentState;
                let nextAgentState = currentAgentState;
                let stateReason = state.agentReason;

                if (!newState.isMarketOpen) {
                    nextAgentState = 'IDLE';
                    stateReason = 'Market Closed';
                } else if (newState.globalKillSwitch) {
                    nextAgentState = 'IDLE';
                    stateReason = 'Emergency Kill Active';
                } else if (currentAgentState === 'IDLE' || currentAgentState === 'COOLDOWN') {
                    nextAgentState = 'SEARCHING';
                    stateReason = 'Scanning market for opportunities';
                } else if (score >= 85) {
                    nextAgentState = 'READY';
                    stateReason = 'Confirming High-Confidence Trade';
                } else if (score >= 60) {
                    nextAgentState = 'ANALYZING';
                    stateReason = 'Price/Indicator Alignment Detected';
                } else {
                    nextAgentState = 'SEARCHING';
                    stateReason = 'Scanning market for opportunities';
                }

                if (nextAgentState !== currentAgentState) {
                    newState.agentState = nextAgentState;
                    newState.agentReason = stateReason;
                    newState.lastAgentAction = Date.now();
                    const logMsg = `AGENT: ${currentAgentState} → ${nextAgentState} (${stateReason})`;
                    newState.systemLogs = [...state.systemLogs.slice(-20), `[${new Date().toLocaleTimeString()}] ${logMsg}`];
                }
            }
        }

        return newState;
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
        const { currentPrice, confluenceScore, globalKillSwitch, addLog, pushNotification, activeView, defaultTrade } = get();

        // 1. Contract Guard (Non-Negotiable)
        if (activeView !== defaultTrade) {
            addLog(`🛑 EXECUTION BLOCKED: ${activeView} is in VIEW ONLY mode. Locked default is ${defaultTrade}.`);
            pushNotification('ERROR', `Execution Blocked: Non-Default Contract`);
            return;
        }

        // 2. Decision Firewall
        const { agentMode } = get();
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

    setContract: (symbol) => {
        set({ activeView: symbol, chartStatus: 'LOADING' });
        get().addLog(`🛰️ INSTRUMENT SYNC: Switching context to ${symbol}...`);
    },

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

            const response = await fetch('/api/trade', {
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
                }),
                credentials: 'include'
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
    setAgentState: (state, reason) => set((prev) => {
        if (prev.agentState === state) return prev;
        const logMsg = `AGENT: ${prev.agentState} → ${state} (${reason})`;
        return {
            agentState: state,
            agentReason: reason,
            lastAgentAction: Date.now(),
            systemLogs: [...prev.systemLogs.slice(-20), `[${new Date().toLocaleTimeString()}] ${logMsg}`]
        };
    }),
    setSearchState: (zone, waitingFor) => set({ searchState: { activeZone: zone, waitingFor } }),

    // Auth Actions
    setAuthenticated: (val) => set({ isAuthenticated: val }),
    setAuthLoading: (val) => set({ isAuthLoading: val }),

    fetchSystemStatus: async () => {
        try {
            const res = await fetch('/health');
            const data = await res.json();
            set({
                systemMode: data.mode as any,
                backendStatus: {
                    status: data.status,
                    dataFeed: data.dataFeed,
                    orders: data.orders
                }
            });
        } catch (error) {
            console.error('Failed to fetch system status:', error);
        }
    },

    addReasoningLog: (state, reason, details) => set((s) => ({
        agentReasoning: [{ timestamp: Date.now(), state, reason, details }, ...s.agentReasoning].slice(0, 50)
    })),
    updateConfidence: (score, breakdown) => set({ confidenceDetail: { score, breakdown } }),
    updateChecklistStatus: (passed, failedItems) => set({ checklistStatus: { passed, failedItems } }),

    addTradeReplay: (replay) => set((s) => ({ tradeReplays: [replay, ...s.tradeReplays].slice(0, 100) })),
    updatePatienceState: (state) => set((s) => ({ patienceState: { ...s.patienceState, ...state } })),
    updateConfidenceDecay: (state) => set((s) => ({ confidenceDecayState: { ...s.confidenceDecayState, ...state } })),
    addStrategyProfile: (profile) => set((s) => ({ strategyProfiles: [...s.strategyProfiles, profile] })),
    setActiveStrategy: (id) => set({ activeStrategyId: id }),

    addEvolutionLog: (log) => set((s) => ({ evolutionLog: [{ timestamp: Date.now(), ...log }, ...s.evolutionLog].slice(0, 100) })),
    addSessionRating: (rating) => set((s) => ({ sessionRatings: [{ sessionDate: Date.now(), ...rating }, ...s.sessionRatings].slice(0, 30) })),
    updateRegimeState: (state) => set((s) => ({ regimeState: { ...s.regimeState, ...state } })),
    setSessionProfile: (profile) => set({ sessionProfile: profile }),
    updateDiagnostics: (diagnostics) => set((s) => {
        const nextDiagnostics = { ...s.systemDiagnostics, ...diagnostics, lastCheck: Date.now() };

        // SAFETY AUTO-PAUSE: If critical failure, force Agent to IDLE
        let nextAgentState = s.agentState;
        let nextAgentReason = s.agentReason;

        const isCriticalFailure = nextDiagnostics.auth === 'FAIL' ||
            nextDiagnostics.marketData === 'DOWN' ||
            nextDiagnostics.backend === 'UNREACHABLE';

        if (isCriticalFailure && s.agentState !== 'IDLE') {
            nextAgentState = 'IDLE';
            nextAgentReason = 'SAFETY PAUSE: System Integrity Compromised';
        }

        return {
            systemDiagnostics: nextDiagnostics,
            agentState: nextAgentState,
            agentReason: nextAgentReason
        };
    })
}));
