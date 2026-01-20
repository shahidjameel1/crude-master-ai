import { useCallback } from 'react';
import { MarketState } from './useStrategyEngine';

export interface TradeSuggestion {
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    sl: number;
    tp: number;
    qty: number;
    riskAmount: number;
    riskPercent: number;
    reason: string;
    isBlocked: boolean;
    blockReason?: string;
    warning?: string;
}

const MAX_RISK_PER_TRADE_PERCENT = 2.0;
const MOCK_CAPITAL = 100000;

export function useTradeAssistant(marketState: MarketState, currentPrice: number) {

    const getSuggestion = useCallback((direction: 'LONG' | 'SHORT'): TradeSuggestion => {
        const { isKillZone, riskStatus } = marketState;

        if (isKillZone) {
            return {
                direction,
                entryPrice: currentPrice,
                sl: 0, tp: 0, qty: 0, riskAmount: 0, riskPercent: 0,
                reason: "Trade blocked by Kill Zone rules.",
                isBlocked: true,
                blockReason: "KILL ZONE ACTIVE (12:30-14:00 IST)"
            };
        }

        const slBuffer = currentPrice * 0.0025;
        const tpBuffer = currentPrice * 0.0050;

        let sl = direction === 'LONG' ? Math.floor(currentPrice - slBuffer) : Math.ceil(currentPrice + slBuffer);
        let tp = direction === 'LONG' ? Math.ceil(currentPrice + tpBuffer) : Math.floor(currentPrice - tpBuffer);

        const riskPerShare = Math.abs(currentPrice - sl);
        const LOT_SIZE = 100;
        const totalRisk = riskPerShare * LOT_SIZE;
        const riskPercent = (totalRisk / MOCK_CAPITAL) * 100;

        let warning = undefined;
        if (riskPercent > MAX_RISK_PER_TRADE_PERCENT) {
            warning = `High Risk: ${riskPercent.toFixed(1)}% exceeds 2% limit.`;
        } else if (riskStatus === 'RISKY') {
            warning = "Market Volatility is High. Reduce size.";
        }

        return {
            direction,
            entryPrice: currentPrice,
            sl,
            tp,
            qty: LOT_SIZE,
            riskAmount: totalRisk,
            riskPercent,
            reason: `Smart SL: ${sl} (${(slBuffer).toFixed(0)} pts) | TP: 1:2 R:R`,
            isBlocked: false,
            warning
        };

    }, [marketState, currentPrice]);

    return { getSuggestion };
}
