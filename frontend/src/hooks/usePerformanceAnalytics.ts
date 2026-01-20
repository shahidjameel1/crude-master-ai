import { useMemo } from 'react';
import { Trade } from './usePaperTrading';

export interface PerformanceMetrics {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnl: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    sharpeRatio: number; // Simplified version
    recoveryFactor: number;
}

export interface BehavioralInsight {
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    title: string;
    description: string;
}

export function usePerformanceAnalytics(tradeHistory: Trade[] = []) {

    const metrics = useMemo((): PerformanceMetrics => {
        if (!tradeHistory) return {
            totalTrades: 0, winRate: 0, profitFactor: 0, totalPnl: 0,
            avgWin: 0, avgLoss: 0, maxDrawdown: 0, sharpeRatio: 0, recoveryFactor: 0
        };
        const closedTrades = tradeHistory.filter(t => t.status === 'CLOSED');
        if (closedTrades.length === 0) {
            return {
                totalTrades: 0, winRate: 0, profitFactor: 0, totalPnl: 0,
                avgWin: 0, avgLoss: 0, maxDrawdown: 0, sharpeRatio: 0, recoveryFactor: 0
            };
        }

        const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
        const losses = closedTrades.filter(t => (t.pnl || 0) <= 0);

        const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

        // Max Drawdown Calculation
        let peak = 0;
        let currentTotal = 0;
        let maxDD = 0;
        closedTrades.reverse().forEach(t => { // Oldest first
            currentTotal += (t.pnl || 0);
            if (currentTotal > peak) peak = currentTotal;
            const dd = peak - currentTotal;
            if (dd > maxDD) maxDD = dd;
        });

        return {
            totalTrades: closedTrades.length,
            winRate: (wins.length / closedTrades.length) * 100,
            profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
            totalPnl,
            avgWin: wins.length === 0 ? 0 : grossProfit / wins.length,
            avgLoss: losses.length === 0 ? 0 : grossLoss / losses.length,
            maxDrawdown: maxDD,
            sharpeRatio: 0, // Placeholder
            recoveryFactor: maxDD === 0 ? 0 : totalPnl / maxDD
        };
    }, [tradeHistory]);

    const insights = useMemo((): BehavioralInsight[] => {
        const result: BehavioralInsight[] = [];
        if (!tradeHistory) return result;
        const closedTrades = tradeHistory.filter(t => t.status === 'CLOSED');

        if (closedTrades.length < 3) return result;

        // 1. Kill Zone Analysis
        const killZoneTrades = closedTrades.filter(t => t.snapshot.isKillZone);
        if (killZoneTrades.length > 0) {
            result.push({
                type: 'NEGATIVE',
                title: 'Kill Zone Violation',
                description: `You have taken ${killZoneTrades.length} trades during the 12:30-14:00 lull. Performance in this window is typically poor.`
            });
        }

        // 2. High Discipline Check (Grade A/A+)
        const highGradeTrades = closedTrades.filter(t => t.grade === 'A' || t.grade === 'A+');
        const disciplineRate = (highGradeTrades.length / closedTrades.length) * 100;

        if (disciplineRate > 70) {
            result.push({
                type: 'POSITIVE',
                title: 'High Discipline',
                description: `Strong adherence to rules! ${disciplineRate.toFixed(0)}% of your trades are Grade A setups.`
            });
        } else if (disciplineRate < 30) {
            result.push({
                type: 'NEGATIVE',
                title: 'Impulsive Entry Pattern',
                description: "Too many trades are being taken on low-probability setups (Grade C/F)."
            });
        }

        // 3. Revenge Trading Correlation (Trades taken shortly after a loss)
        let revengeCount = 0;
        for (let i = 0; i < closedTrades.length - 1; i++) {
            const current = closedTrades[i]; // Newest first
            const previous = closedTrades[i + 1];
            if ((previous.pnl || 0) < 0) {
                const timeDiff = current.entryTime - (previous.exitTime || 0);
                if (timeDiff < 15 * 60 * 1000) { // Less than 15 mins
                    revengeCount++;
                }
            }
        }
        if (revengeCount > 0) {
            result.push({
                type: 'NEGATIVE',
                title: 'Revenge Trading Alert',
                description: `Identified ${revengeCount} instances of trading too quickly after a loss. Take a walk!`
            });
        }

        return result;
    }, [tradeHistory]);

    return { metrics, insights };
}
