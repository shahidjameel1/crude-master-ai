import { RiskParameters, TradeSignal, SystemState, OrderDirection } from '../types';

/**
 * Risk Manager - Enforces strict risk management rules
 * - 1% risk per trade
 * - 1:2 Risk-Reward ratio minimum
 * - Daily profit target: 50 points
 * - Max daily loss: 25 points
 * - Consecutive loss handling
 */
export class RiskManager {
    private riskParams: RiskParameters;

    constructor(riskParams: RiskParameters) {
        this.riskParams = riskParams;
    }

    /**
     * Calculate position size based on account balance and stop loss
     * Formula: Position Size = (Account Balance * Risk%) / Stop Loss Points
     */
    calculatePositionSize(
        accountBalance: number,
        stopLossPoints: number
    ): number {
        const riskAmount = accountBalance * (this.riskParams.riskPerTradePercent / 100);
        const lotSize = Math.floor(riskAmount / stopLossPoints);

        // Cap at max position size
        return Math.min(lotSize, this.riskParams.maxPositionSizeLots);
    }

    /**
     * Validate trade signal against risk parameters
     */
    validateSignal(signal: TradeSignal, systemState: SystemState): {
        isValid: boolean;
        reason?: string;
    } {
        // Check if trading is enabled
        if (!systemState.isTradingEnabled) {
            return { isValid: false, reason: 'Trading disabled by system' };
        }

        // Check if instrument is authorized
        // HARD-CODED SECURITY: Only CRUDEOILM allowed by default
        if (signal.symbol !== 'CRUDEOILM' && process.env.ALLOW_CRUDEOIL_FULL !== 'true') {
            return { isValid: false, reason: `Unauthorized Instrument: ${signal.symbol}. Only CRUDEOILM allowed.` };
        }

        // Check if paused
        if (systemState.isPaused) {
            return { isValid: false, reason: `System paused: ${systemState.pauseReason}` };
        }

        // Check daily profit target reached
        if (systemState.dailyPnlPoints >= this.riskParams.dailyProfitTargetPoints) {
            return {
                isValid: false,
                reason: `Daily profit target of ${this.riskParams.dailyProfitTargetPoints} points reached`
            };
        }

        // Check max daily loss reached
        if (systemState.dailyPnlPoints <= -this.riskParams.maxDailyLossPoints) {
            return {
                isValid: false,
                reason: `Max daily loss of ${this.riskParams.maxDailyLossPoints} points hit. Trading stopped for today.`
            };
        }

        // Check consecutive losses (switch to demo after 2 losses)
        if (systemState.consecutiveLosses >= 2) {
            return {
                isValid: false,
                reason: '2 consecutive losses detected. Switching to demo mode for 1 hour.'
            };
        }

        // Validate Risk-Reward Ratio
        if (signal.riskRewardRatio < this.riskParams.riskRewardRatio) {
            return {
                isValid: false,
                reason: `Risk-Reward ratio ${signal.riskRewardRatio.toFixed(2)} is below minimum ${this.riskParams.riskRewardRatio}`
            };
        }

        // Validate stop loss and take profit
        const stopLossPoints = Math.abs(signal.entryPrice - signal.stopLoss);
        const takeProfitPoints = Math.abs(signal.takeProfit - signal.entryPrice);

        if (stopLossPoints === 0 || takeProfitPoints === 0) {
            return { isValid: false, reason: 'Invalid stop loss or take profit' };
        }

        // For 50-point target with 1:2 RR, SL should be ~25 points
        const expectedSL = this.riskParams.dailyProfitTargetPoints / this.riskParams.riskRewardRatio;
        if (stopLossPoints > expectedSL * 1.5) {
            return {
                isValid: false,
                reason: `Stop loss too wide: ${stopLossPoints.toFixed(0)} points (expected ~${expectedSL.toFixed(0)})`
            };
        }

        // Check Trading Window (18:00 - 20:30 IST)
        if (!this.isValidTradingWindow()) {
            return { isValid: false, reason: 'Outside trading window (18:00 - 20:30 IST)' };
        }

        // Check Capital Preservation (Drawdown from Peak)
        if (this.riskParams.maxEquityDrawdownPercent && systemState.peakBalance > 0) {
            const currentEquity = this.riskParams.accountBalance + (systemState.dailyPnlPoints * 20); // Approx equity simulation
            const drawdownPercent = ((systemState.peakBalance - currentEquity) / systemState.peakBalance) * 100;

            if (drawdownPercent > this.riskParams.maxEquityDrawdownPercent) {
                return {
                    isValid: false,
                    reason: `Capital Shield: Drawdown ${drawdownPercent.toFixed(1)}% exceeds limit ${this.riskParams.maxEquityDrawdownPercent}%`
                };
            }
        }

        // Check Weekly Lock
        if (systemState.isWeeklyLocked) {
            return { isValid: false, reason: 'Weekly Capital Lock is active. See you next week.' };
        }


        return { isValid: true };
    }

    /**
     * Check if current time is within 18:00 - 20:30 IST
     */
    private isValidTradingWindow(): boolean {
        // Get current time in IST
        const now = new Date();
        const istOptions = { timeZone: 'Asia/Kolkata', hour12: false };
        const istString = now.toLocaleTimeString('en-US', istOptions); // "18:30:00"

        const [hours, minutes] = istString.split(':').map(Number);
        const currentTime = hours * 60 + minutes;

        const startTime = 18 * 60;      // 18:00
        const endTime = 20 * 60 + 30;   // 20:30

        return currentTime >= startTime && currentTime <= endTime;
    }

    /**
     * Calculate optimal SL and TP for given entry and direction
     */
    calculateSLTP(
        entryPrice: number,
        direction: OrderDirection,
        basedOnATR?: number
    ): { stopLoss: number; takeProfit: number; riskRewardRatio: number } {
        // Default SL: 25 points for 50-point target (1:2 RR)
        const defaultSLPoints = this.riskParams.dailyProfitTargetPoints / this.riskParams.riskRewardRatio;
        const defaultTPPoints = this.riskParams.dailyProfitTargetPoints;

        // If ATR provided, use it to dynamic sizing (more volatile = wider SL)
        const slPoints = basedOnATR ? Math.max(basedOnATR * 1.5, defaultSLPoints) : defaultSLPoints;
        const tpPoints = slPoints * this.riskParams.riskRewardRatio;

        let stopLoss: number;
        let takeProfit: number;

        if (direction === OrderDirection.LONG) {
            stopLoss = entryPrice - slPoints;
            takeProfit = entryPrice + tpPoints;
        } else {
            stopLoss = entryPrice + slPoints;
            takeProfit = entryPrice - tpPoints;
        }

        return {
            stopLoss,
            takeProfit,
            riskRewardRatio: tpPoints / slPoints
        };
    }

    /**
     * Update system state after trade closes
     */
    updateAfterTrade(
        systemState: SystemState,
        profitLossPoints: number
    ): SystemState {
        const newState = { ...systemState };

        newState.dailyPnlPoints += profitLossPoints;
        newState.tradesToday += 1;
        newState.lastTradeTime = new Date();

        // Track consecutive losses
        if (profitLossPoints < 0) {
            newState.consecutiveLosses += 1;
        } else {
            newState.consecutiveLosses = 0; // Reset on win
        }

        // Auto-pause if hit limits
        if (newState.dailyPnlPoints >= this.riskParams.dailyProfitTargetPoints) {
            newState.isPaused = true;
            newState.pauseReason = 'Daily profit target reached. Waiting for next session.';
        }

        if (newState.dailyPnlPoints <= -this.riskParams.maxDailyLossPoints) {
            newState.isPaused = true;
            newState.pauseReason = 'Max daily loss hit. Trading stopped for today.';
        }

        if (newState.consecutiveLosses >= 2) {
            newState.isPaused = true;
            newState.pauseReason = '2 consecutive losses. Switching to demo mode for 1 hour.';
        }

        return newState;
    }

    /**
     * Check if we should scale out (take partial profits)
     * If 50% of target hit, close 50% of position
     */
    shouldScaleOut(
        entryPrice: number,
        currentPrice: number,
        takeProfit: number,
        direction: OrderDirection
    ): { shouldScale: boolean; percentToClose: number } {
        const targetDistance = Math.abs(takeProfit - entryPrice);
        const currentDistance = Math.abs(currentPrice - entryPrice);

        const progressPercent = (currentDistance / targetDistance) * 100;

        // Scale out 50% at 50% of target
        if (progressPercent >= 50 && progressPercent < 75) {
            return { shouldScale: true, percentToClose: 50 };
        }

        // Close another 25% at 75%
        if (progressPercent >= 75 && progressPercent < 100) {
            return { shouldScale: true, percentToClose: 25 };
        }

        return { shouldScale: false, percentToClose: 0 };
    }

    /**
     * Adjust position size based on market regime
     * Reduce size in volatile/ranging markets
     */
    adjustPositionForRegime(
        basePositionSize: number,
        regime: 'trending' | 'ranging' | 'breakout',
        volatility: 'low' | 'medium' | 'high'
    ): number {
        let multiplier = 1.0;

        // Reduce size in ranging markets (harder to profit)
        if (regime === 'ranging') multiplier *= 0.7;

        // Reduce size in high volatility (more risk)
        if (volatility === 'high') multiplier *= 0.8;

        // Increase slightly in trending + low volatility (ideal conditions)
        if (regime === 'trending' && volatility === 'low') multiplier *= 1.2;

        return Math.floor(basePositionSize * multiplier);
    }
}
