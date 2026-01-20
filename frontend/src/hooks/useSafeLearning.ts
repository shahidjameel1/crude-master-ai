import { useMemo } from 'react';
import { Trade } from './usePaperTrading';

export interface StrategyEvolution {
    strategyName: string;
    marketCondition: string;
    sessionAllowed: string;
    entryConditions: string[];
    stopLossLogic: string;
    takeProfitLogic: string;
    riskReward: string;
    whyThisStrategyWorks: string;
    whenNotToUseIt: string;
    evidence: string;
}

export function useSafeLearning(tradeHistory: Trade[]) {

    const suggestions = useMemo((): StrategyEvolution[] => {
        const closedTrades = tradeHistory.filter(t => t.status === 'CLOSED');
        if (closedTrades.length < 5) return [];

        const results: StrategyEvolution[] = [];

        // 1. Analyze Session Performance
        const morningTrades = closedTrades.filter(t => {
            const hour = new Date(t.entryTime).getHours();
            return hour < 12;
        });
        const morningWinRate = morningTrades.length > 0
            ? (morningTrades.filter(t => (t.pnl || 0) > 0).length / morningTrades.length) * 100
            : 0;

        if (morningWinRate > 65 && morningTrades.length >= 3) {
            results.push({
                strategyName: "Morning VWAP Expansion",
                marketCondition: "Early session momentum with VWAP alignment",
                sessionAllowed: "09:15 - 12:00 IST",
                entryConditions: [
                    "Price > VWAP",
                    "EMA 20/50 Bullish Stack",
                    "RSI > 55 (Momentum Healthy)"
                ],
                stopLossLogic: "Below previous candle low or VWAP - 10 ticks",
                takeProfitLogic: "1.5R - 2.0R static target",
                riskReward: "1:1.5 minimum",
                whyThisStrategyWorks: `Observed ${morningWinRate.toFixed(0)}% win rate during morning sessions. Institutional volume favors continuation early in the day.`,
                whenNotToUseIt: "During lunch lull (12:30-14:00) or high impact news.",
                evidence: `Based on ${morningTrades.length} institutional observations.`
            });
        }

        // 2. Identify Underperforming Contexts
        const postLunchTrades = closedTrades.filter(t => {
            const hour = new Date(t.entryTime).getHours();
            return hour >= 14;
        });
        const postLunchLosses = postLunchTrades.filter(t => (t.pnl || 0) < 0).length;

        if (postLunchLosses > postLunchTrades.length * 0.6 && postLunchTrades.length >= 3) {
            results.push({
                strategyName: "Post-Lunch Mean Reversion (Advisory)",
                marketCondition: "Choppy range following trend exhaustion",
                sessionAllowed: "14:00 - 15:30 IST",
                entryConditions: [
                    "Price deviation > 2x ATR from VWAP",
                    "RSI > 75 or < 25 (Exhaustion)",
                    "SMT Divergence confirmation required"
                ],
                stopLossLogic: "Fixed 40 ticks from entry",
                takeProfitLogic: "Return to VWAP Mean",
                riskReward: "1:2.5",
                whyThisStrategyWorks: "High failure rate observed in trend-following setups after 14:00. Switching to mean reversion captures session-end rebalancing.",
                whenNotToUseIt: "If trend remains exceptionally strong on high volume.",
                evidence: "Current trend-following win rate post-14:00 is < 40%."
            });
        }

        return results;
    }, [tradeHistory]);

    return { suggestions };
}
