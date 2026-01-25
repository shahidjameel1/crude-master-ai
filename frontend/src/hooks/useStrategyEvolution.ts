import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useStrategyEvolution = () => {
    const {
        evolutionLog,
        addEvolutionLog,
        addReasoningLog,
        tradeHistory,
        strategies
    } = useStore();

    // Track confirmation performance and adjust weights
    const evaluateAndEvolve = () => {
        // Only evolve after minimum sample size (50+ trades)
        if (tradeHistory.length < 50) return;

        // Calculate win contribution per confirmation
        const confirmationPerformance: Record<string, { wins: number; total: number }> = {};

        tradeHistory.slice(-50).forEach((trade: any) => {
            if (!trade.strategyComponents) return;

            Object.entries(trade.strategyComponents).forEach(([key, value]) => {
                if (!confirmationPerformance[key]) {
                    confirmationPerformance[key] = { wins: 0, total: 0 };
                }
                confirmationPerformance[key].total++;
                if (trade.result === 'WIN') {
                    confirmationPerformance[key].wins++;
                }
            });
        });

        // Find confirmation with highest win rate that could benefit from weight increase
        let bestConfirmation: string | null = null;
        let bestWinRate = 0;

        Object.entries(confirmationPerformance).forEach(([key, perf]) => {
            const winRate = perf.wins / perf.total;
            if (winRate > bestWinRate && winRate > 0.65) { // Only evolve if >65% win rate
                bestWinRate = winRate;
                bestConfirmation = key;
            }
        });

        if (bestConfirmation) {
            // Find current strategy weight
            const strategy = strategies.find(s => s.enabled);
            if (!strategy) return;

            // Micro-adjustment: +0.5% only
            const oldWeight = strategy.weight;
            const newWeight = Math.min(oldWeight + 0.5, 50); // Hard max at 50

            if (newWeight !== oldWeight) {
                addEvolutionLog({
                    confirmation: bestConfirmation,
                    oldWeight,
                    newWeight,
                    reason: `${(bestWinRate * 100).toFixed(1)}% win rate over last 50 trades`
                });

                addReasoningLog(
                    'ANALYZING',
                    `Strategy evolution: ${bestConfirmation} weight adjusted`,
                    `${oldWeight}% → ${newWeight}% due to strong performance`
                );
            }
        }
    };

    // Run evolution check periodically (every 10 trades)
    useEffect(() => {
        if (tradeHistory.length > 0 && tradeHistory.length % 10 === 0) {
            evaluateAndEvolve();
        }
    }, [tradeHistory.length]);

    return {
        evolutionLog,
        evaluateAndEvolve
    };
};
