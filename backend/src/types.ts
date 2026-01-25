// Shared Types for CRUDE-MASTER AI

export interface Candle {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketData {
    symbol: string;
    interval: string;
    candles: Candle[];
    lastUpdate: Date;
}

export enum OrderDirection {
    LONG = 'BUY',
    SHORT = 'SELL'
}

export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL'
}

export enum OrderType {
    MARKET = 'MARKET',
    LIMIT = 'LIMIT'
}

export enum OrderStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    STOPPED = 'STOPPED',
    CANCELLED = 'CANCELLED'
}

export enum OperationalMode {
    NORMAL = 'NORMAL',
    GLASS = 'GLASS', // Read-only
    EMERGENCY_LOCK = 'EMERGENCY_LOCK' // Dead man switch activated
}

export enum TradingMode {
    PAPER = 'PAPER',
    SHADOW = 'SHADOW',
    ASSISTED = 'ASSISTED',
    LIVE = 'LIVE'
}

export interface TradeSignal {
    symbol: string;
    direction: OrderDirection;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number; // 0-100
    strategyName: string;
    reason: string;
    patternsDetected: PatternDetection[];
    timeframeBias: Record<string, 'bullish' | 'bearish' | 'neutral'>;
    riskRewardRatio: number;
}

export interface Opportunity {
    direction: OrderDirection;
    score: number;
    reason: string;
    missingConditions: string[];
}

export interface AnalysisResult {
    signal: TradeSignal | null;
    shouldTrade: boolean;
    explanation: string;
    opportunities: Opportunity[];
}

export interface Trade {
    id: string;
    strategyId: string;
    direction: OrderDirection;
    entryPrice: number;
    entryTime: Date;
    exitPrice?: number;
    exitTime?: Date;
    stopLoss: number;
    takeProfit: number;
    positionSize: number; // lots
    riskRewardRatio: number;
    profitLossPoints?: number;
    profitLossAmount?: number;
    status: OrderStatus;
    entryReason: string;
    marketCondition: MarketCondition;
    timeframeBias: Record<string, string>;
    patternsDetected: PatternDetection[];
    chartSnapshotUrl?: string;
    tradingMode: TradingMode;
    angelOrderId?: string;
}

export interface PatternDetection {
    type: string; // 'fvg', 'order_block', 'liquidity_grab', etc.
    confidence: number; // 0-1
    price?: number;
    details?: Record<string, any>;
}

export interface MarketCondition {
    trend: 'bullish' | 'bearish' | 'neutral';
    volatility: 'low' | 'medium' | 'high';
    session: 'pre-market' | 'morning' | 'afternoon' | 'evening' | 'closed';
    regime: 'trending' | 'ranging' | 'breakout';
    adx?: number;
    atr?: number;
}

export interface Strategy {
    id: string;
    name: string;
    type: string;
    description: string;
    parameters: Record<string, any>;
    isActive: boolean;
    weight: number;
    totalTrades: number;
    winningTrades: number;
    totalProfitPoints: number;
    maxDrawdownPoints: number;
    sharpeRatio?: number;
    winRate?: number;
    generation: number;
}

export interface PerformanceMetrics {
    date: Date;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    dailyPnlPoints: number;
    dailyPnlAmount: number;
    maxDrawdownPoints: number;
    largestWinPoints: number;
    largestLossPoints: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    expectancy: number;
}

export interface SystemState {
    tradingMode: TradingMode;
    isTradingEnabled: boolean;
    currentDate: Date;
    dailyPnlPoints: number;
    tradesToday: number;
    consecutiveLosses: number;
    isPaused: boolean;
    pauseReason?: string;
    lastTradeTime?: Date;
    operationalMode: OperationalMode;
    peakBalance: number; // For drawdown tracking
    isWeeklyLocked: boolean; // For weekly lock
}

export interface Heartbeat {
    timestamp: Date;
    status: 'OK' | 'DEGRADED' | 'DOWN';
    latencyMs: number;
    services: {
        database: boolean;
        broker: boolean;
        feed: boolean;
    };
}

export interface TradingWindow {
    start: string; // HH:mm format, e.g. "18:00"
    end: string; // HH:mm format, e.g. "20:30"
    timezone: string; // e.g. "Asia/Kolkata"
}

export interface RiskParameters {
    maxDailyLossPoints: number;
    dailyProfitTargetPoints: number;
    riskRewardRatio: number;
    maxPositionSizeLots: number;
    accountBalance: number;
    riskPerTradePercent: number;
    maxEquityDrawdownPercent?: number; // Stop if equity drops X% from peak
}

export interface NewsEvent {
    eventTime: Date;
    eventName: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    pauseBeforeMinutes: number;
    pauseAfterMinutes: number;
    category: string;
}

// ICT/SMC Specific Types
export interface FairValueGap {
    type: 'bullish' | 'bearish';
    top: number;
    bottom: number;
    candleIndex: number;
    isFilled: boolean;
}

export interface OrderBlock {
    type: 'bullish' | 'bearish';
    price: number;
    candleIndex: number;
    strength: number; // 0-1
}

export interface LiquidityZone {
    type: 'equal_highs' | 'equal_lows';
    price: number;
    occurrences: number;
    isSwept: boolean;
}

export interface MarketStructure {
    trend: 'bullish' | 'bearish' | 'neutral';
    lastBOS?: number; // Break of Structure price
    lastCHOCH?: number; // Change of Character price
    higherHighs: number[];
    lowerLows: number[];
}

export interface PremiumDiscountZone {
    premium: { top: number; bottom: number };
    equilibrium: number;
    discount: { top: number; bottom: number };
}
