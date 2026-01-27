import {
    Trade,
    TradeSignal,
    OrderStatus,
    Candle,
    SystemState,
    TradingMode,
    MarketData,
    OperationalMode,
    OrderDirection
} from '../types';
import { RiskManager } from '../risk/RiskManager';
import { ICTSMCHybridStrategy } from '../strategies/implementations/ICTSMCHybridStrategy';

/**
 * Paper Trading Simulator
 * Simulates live trading without real money
 * Uses real market data but virtual positions
 */
export class PaperTrader {
    private strategy: ICTSMCHybridStrategy;
    private riskManager: RiskManager;
    private openTrades: Map<string, Trade> = new Map();
    private closedTrades: Trade[] = [];
    private systemState: SystemState;

    constructor(riskManager: RiskManager, systemState: SystemState) {
        this.strategy = new ICTSMCHybridStrategy();
        this.riskManager = riskManager;
        this.systemState = systemState;
    }

    /**
     * Main trading loop - analyzes market and executes trades
     */
    async processMarketData(marketData: Record<string, MarketData>): Promise<{
        newTrade?: Trade;
        closedTrades: Trade[];
        systemState: SystemState;
    }> {
        const currentPrice = marketData['1m']?.candles[marketData['1m'].candles.length - 1].close || 0;

        // Update existing positions
        const closedTrades = this.updatePositions(currentPrice);

        // Check if we can take new trades
        if (this.openTrades.size > 0 || !this.systemState.isTradingEnabled) {
            return { closedTrades, systemState: this.systemState };
        }

        // Check Operational Mode (Glass Mode / Emergency Lock)
        // We import OperationalMode from '../types' but it's an Enum value, not a type.
        // Since we didn't import the Enum value in the original file, we need to check the string or modify imports.
        // Assuming OperationalMode is available or we check systemState.operationalMode directly against strings if needed.
        // Note: The generic types.ts export includes the Enum. Need to ensure it's imported in PaperTrader.ts
        if (this.systemState.operationalMode && this.systemState.operationalMode !== 'NORMAL') {
            console.log(`Trade blocked: System is in ${this.systemState.operationalMode} mode`);
            return { closedTrades, systemState: this.systemState };
        }

        // Generate signal from strategy
        const analysis = await this.strategy.analyze(marketData);

        // Log explanation if not trading (for debug/dashboard)
        if (!analysis.shouldTrade && analysis.explanation) {
            // In a real app, this would be pushed to frontend
            // console.log(`ℹ️ Strategy Info: ${analysis.explanation}`);
        }

        if (!analysis.signal) {
            return { closedTrades, systemState: this.systemState };
        }

        const signal = analysis.signal;

        // Validate signal through risk manager
        const validation = this.riskManager.validateSignal(signal, this.systemState);

        if (!validation.isValid) {
            console.log(`Signal rejected: ${validation.reason}`);
            return { closedTrades, systemState: this.systemState };
        }

        // Execute trade
        const newTrade = this.executeTrade(signal, currentPrice, marketData);

        return { newTrade, closedTrades, systemState: this.systemState };
    }

    /**
     * Execute a trade based on signal
     */
    private executeTrade(
        signal: TradeSignal,
        currentPrice: number,
        marketData: Record<string, MarketData>
    ): Trade {
        // Calculate position size
        const stopLossPoints = Math.abs(signal.entryPrice - signal.stopLoss);
        const positionSize = this.riskManager.calculatePositionSize(
            this.systemState.dailyPnlPoints || 100000,
            stopLossPoints
        );

        // Determine market condition
        const marketCondition = this.strategy.determineMarketCondition(marketData['15m']?.candles || []);

        const trade: Trade = {
            id: this.generateTradeId(),
            strategyId: 'ict-smc-hybrid',
            direction: signal.direction,
            entryPrice: signal.entryPrice,
            entryTime: new Date(),
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            positionSize,
            riskRewardRatio: signal.riskRewardRatio,
            status: OrderStatus.OPEN,
            entryReason: signal.reason,
            marketCondition,
            timeframeBias: signal.timeframeBias,
            patternsDetected: signal.patternsDetected,
            tradingMode: this.systemState.tradingMode
        };

        this.openTrades.set(trade.id, trade);

        console.log(`📈 NEW ${trade.direction} TRADE @ ${trade.entryPrice}`);
        console.log(`   SL: ${trade.stopLoss} | TP: ${trade.takeProfit} | RR: 1:${trade.riskRewardRatio}`);
        console.log(`   Reason: ${trade.entryReason}`);
        console.log(`   Confidence: ${signal.confidence.toFixed(0)}%`);

        return trade;
    }

    /**
     * Update open positions - check for SL/TP hits
     */
    private updatePositions(currentPrice: number): Trade[] {
        const closed: Trade[] = [];

        for (const [tradeId, trade] of this.openTrades) {
            let shouldClose = false;
            let exitReason = '';

            // Check if stop loss hit
            if (
                (trade.direction === OrderDirection.LONG && currentPrice <= trade.stopLoss) ||
                (trade.direction === OrderDirection.SHORT && currentPrice >= trade.stopLoss)
            ) {
                shouldClose = true;
                exitReason = 'Stop Loss';
                trade.status = OrderStatus.STOPPED;
            }

            // Check if take profit hit
            if (
                (trade.direction === OrderDirection.LONG && currentPrice >= trade.takeProfit) ||
                (trade.direction === OrderDirection.SHORT && currentPrice <= trade.takeProfit)
            ) {
                shouldClose = true;
                exitReason = 'Take Profit';
                trade.status = OrderStatus.CLOSED;
            }

            if (shouldClose) {
                trade.exitPrice = currentPrice;
                trade.exitTime = new Date();

                // Calculate P&L
                if (trade.direction === OrderDirection.LONG) {
                    trade.profitLossPoints = trade.exitPrice - trade.entryPrice;
                } else {
                    trade.profitLossPoints = trade.entryPrice - trade.exitPrice;
                }

                trade.profitLossAmount = trade.profitLossPoints * trade.positionSize;

                // Update system state
                this.systemState = this.riskManager.updateAfterTrade(
                    this.systemState,
                    trade.profitLossPoints
                );

                console.log(`\n🔔 TRADE CLOSED: ${exitReason}`);
                console.log(`   Entry: ${trade.entryPrice} → Exit: ${trade.exitPrice}`);
                console.log(`   P&L: ${trade.profitLossPoints?.toFixed(1)} points (${trade.profitLossAmount?.toFixed(0)} INR)`);
                console.log(`   Daily P&L: ${this.systemState.dailyPnlPoints.toFixed(1)} / 50 target\n`);

                closed.push(trade);
                this.closedTrades.push(trade);
                this.openTrades.delete(tradeId);
            }
        }

        return closed;
    }

    private generateTradeId(): string {
        return `TRADE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get trade statistics
     */
    getStatistics(): {
        totalTrades: number;
        wins: number;
        losses: number;
        winRate: number;
        totalPnL: number;
        avgWin: number;
        avgLoss: number;
    } {
        const wins = this.closedTrades.filter(t => (t.profitLossPoints || 0) > 0);
        const losses = this.closedTrades.filter(t => (t.profitLossPoints || 0) < 0);

        const totalPnL = this.closedTrades.reduce((sum, t) => sum + (t.profitLossPoints || 0), 0);
        const avgWin = wins.length > 0
            ? wins.reduce((sum, t) => sum + (t.profitLossPoints || 0), 0) / wins.length
            : 0;
        const avgLoss = losses.length > 0
            ? losses.reduce((sum, t) => sum + (t.profitLossPoints || 0), 0) / losses.length
            : 0;

        return {
            totalTrades: this.closedTrades.length,
            wins: wins.length,
            losses: losses.length,
            winRate: this.closedTrades.length > 0 ? (wins.length / this.closedTrades.length) * 100 : 0,
            totalPnL,
            avgWin,
            avgLoss
        };
    }

    /**
     * Reset daily counters (call at session end)
     */
    resetDailyState(): void {
        this.systemState.dailyPnlPoints = 0;
        this.systemState.tradesToday = 0;
        this.systemState.consecutiveLosses = 0;
        this.systemState.isPaused = false;
        this.systemState.pauseReason = undefined;
        this.systemState.currentDate = new Date();
    }
}
