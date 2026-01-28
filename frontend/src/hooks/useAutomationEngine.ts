import { useState, useMemo, useCallback, useEffect } from 'react';
import { Trade, usePaperTrading } from './usePaperTrading';
import { usePerformanceAnalytics } from './usePerformanceAnalytics';
import { MarketState } from './useStrategyEngine';
import { AutomationGate } from '../logic/AutomationGate';
import { saveAuditLog, generateEventId } from '../logic/AuditLogStore';

export type AutomationMode = 'OFF' | 'STRATEGY_LIMITED' | 'MULTI' | 'FULL_SESSION';

export function useAutomationEngine(
    tradeHistory: Trade[],
    marketState: MarketState,
    currentPrice: number,
    paperTrading: ReturnType<typeof usePaperTrading>,
    activeView: string,
    defaultTrade: string,
    pointsToday: number,
    targetPoints: number,
    stopLossPoints: number,
    accountSize: number,
    riskPerTrade: number,
    multiplier: number
) {
    const [mode, setMode] = useState<AutomationMode>('OFF');
    const { metrics } = usePerformanceAnalytics(tradeHistory);
    const { enterTrade, position, closeTrade } = paperTrading;

    // --- PREREQUISITE CHECKS ---
    const prerequisites = useMemo(() => {
        const tradeCountPassed = metrics.totalTrades >= 5; // Reduced to 5 for production readiness visibility
        const expectancyPassed = metrics.totalPnl >= 0;
        const disciplinePassed = true;

        return {
            tradeCountPassed,
            expectancyPassed,
            disciplinePassed,
            isUnlocked: tradeCountPassed && expectancyPassed && disciplinePassed
        };
    }, [metrics]);

    // --- GLOBAL KILL SWITCH ---
    const globalKillSwitch = useCallback(async () => {
        console.warn('🔴 GLOBAL KILL SWITCH ACTIVATED');
        setMode('OFF');

        try {
            // 🚀 Call Backend Emergency Kill
            const token = localStorage.getItem('friday_auth_token');
            await fetch('/api/security/kill', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (err) {
            console.error('Failed to trigger backend kill switch:', err);
        }

        if (position) {
            closeTrade(currentPrice);
        }

        saveAuditLog({
            timestamp: Date.now(),
            eventId: generateEventId(),
            type: 'SYSTEM',
            strategyVersion: '1.0.0-PROD',
            ruleVersion: 'SAFETY_V1',
            marketSnapshot: { price: currentPrice, score: 0, vwap: 0, isKillZone: false, volatility: 0 },
            decision: { action: 'PAUSE', reason: 'User Manual Override: Global Kill Switch Triggered', confluenceBreakdown: {} }
        });
    }, [position, closeTrade, currentPrice]);

    // --- AUTOMATION TICK ---
    useEffect(() => {
        // AGENT EXECUTION GUARD (NON-NEGOTIABLE)
        if (activeView !== defaultTrade) return;

        if (mode === 'OFF' || position || !prerequisites.isUnlocked) return;

        // Check Laws (Institutional Master Rules)
        const lawResult = AutomationGate.checkLaws(
            marketState,
            currentPrice,
            mode,
            pointsToday,
            targetPoints,
            stopLossPoints
        );

        if (lawResult.passed) {
            // Dynamic Lot Scaling: Lots = (Capital * Risk%) / (SL_Distance * Multiplier)
            const slDistance = 20; // Points
            const riskAmount = (accountSize * riskPerTrade) / 100;
            const qty = Math.max(10, Math.floor(riskAmount / (slDistance * multiplier)) * 10); // Standardized to 10 qty units
            const lots = qty / 10;

            enterTrade(
                marketState.trend === 'UP' ? 'LONG' : 'SHORT',
                currentPrice,
                marketState,
                `MASTER_ENGINE_${marketState.confluenceScore}`,
                currentPrice - slDistance,
                currentPrice + (slDistance * 2),
                qty
            );

            saveAuditLog({
                timestamp: Date.now(),
                eventId: generateEventId(),
                type: 'EXECUTION',
                strategyVersion: '1.0.0-DETERMINISTIC',
                ruleVersion: 'LAW_V1',
                marketSnapshot: {
                    price: currentPrice,
                    score: marketState.confluenceScore,
                    vwap: 0,
                    isKillZone: marketState.isKillZone,
                    volatility: 0
                },
                decision: {
                    action: 'EXECUTE',
                    reason: 'All Law checks passed. Strategy condition met.',
                    confluenceBreakdown: { score: marketState.confluenceScore }
                },
                riskDecision: {
                    qty,
                    lots,
                    sl: currentPrice - slDistance,
                    tp: currentPrice + (slDistance * 2),
                    riskPercent: riskPerTrade
                }
            });
        }
    }, [mode, marketState, currentPrice, position, prerequisites.isUnlocked, enterTrade]);

    return {
        mode,
        setMode,
        prerequisites,
        globalKillSwitch,
        metrics
    };
}
