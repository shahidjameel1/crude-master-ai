import { useState, useCallback, useEffect } from 'react';
import { MarketState } from './useStrategyEngine';

export interface TradeContextSnapshot {
    score: number;
    trend: string;
    riskStatus: string;
    isKillZone: boolean;
    headline: string; // From Insight
}

export interface Trade {
    id: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    entryTime: number;
    exitPrice?: number;
    exitTime?: number;
    pnl?: number;
    status: 'OPEN' | 'CLOSED';
    snapshot: TradeContextSnapshot;
    grade?: string;
    feedback?: string;

    sl?: number;
    tp?: number;
    qty?: number;
    isBE?: boolean;
}

export function usePaperTrading() {
    // Phase 11: Initialize from LocalStorage
    const [tradeHistory, setTradeHistory] = useState<Trade[]>(() => {
        const saved = localStorage.getItem('CRUDE_MASTER_TRADES');
        return saved ? JSON.parse(saved) : [];
    });
    const [position, setPosition] = useState<Trade | null>(() => {
        const saved = localStorage.getItem('CRUDE_MASTER_ACTIVE_POS');
        return saved ? JSON.parse(saved) : null;
    });
    const [lastCompletedTrade, setLastCompletedTrade] = useState<Trade | null>(null);

    // Sync to LocalStorage
    useEffect(() => {
        localStorage.setItem('CRUDE_MASTER_TRADES', JSON.stringify(tradeHistory));
    }, [tradeHistory]);

    useEffect(() => {
        localStorage.setItem('CRUDE_MASTER_ACTIVE_POS', JSON.stringify(position));
    }, [position]);

    const enterTrade = useCallback((
        direction: 'LONG' | 'SHORT',
        price: number,
        marketState: MarketState,
        insightHeadline: string,
        sl?: number,
        tp?: number,
        qty?: number
    ) => {
        if (position) return; // Already in a trade

        const newTrade: Trade = {
            id: Date.now().toString(),
            direction,
            entryPrice: price,
            entryTime: Date.now(),
            status: 'OPEN',
            snapshot: {
                score: marketState.confluenceScore,
                trend: marketState.trend,
                riskStatus: marketState.riskStatus,
                isKillZone: marketState.isKillZone,
                headline: insightHeadline
            },
            sl,
            tp,
            qty
        };

        setPosition(newTrade);
    }, [position]);

    const closeTrade = useCallback((exitPrice: number) => {
        if (!position) return;

        // Calculate P&L
        let pnl = 0;
        if (position.direction === 'LONG') {
            pnl = exitPrice - position.entryPrice;
        } else {
            pnl = position.entryPrice - exitPrice;
        }

        // --- GRADING LOGIC (Deterministic) ---
        let grade = 'B';
        let feedback = 'Standard execution.';
        const { score, isKillZone, riskStatus } = position.snapshot;

        if (isKillZone) {
            grade = 'F';
            feedback = 'VIOLATION: Traded during Kill Zone (Lunch Lull).';
        } else if (riskStatus === 'RISKY') {
            grade = 'C-';
            feedback = 'Risky entry during high volatility/spreads.';
        } else if (score >= 80) {
            grade = 'A+';
            feedback = 'Excellent. Aligned with high-probability setup.';
        } else if (score >= 60) {
            grade = 'A';
            feedback = 'Solid execution. Good confluence.';
        } else if (score < 40) {
            grade = 'C';
            feedback = 'Weak setup. Forced entry against rules.';
        }

        const completedTrade: Trade = {
            ...position,
            status: 'CLOSED',
            exitPrice,
            exitTime: Date.now(),
            pnl,
            grade,
            feedback
        };

        setTradeHistory(prev => [completedTrade, ...prev]);
        setPosition(null);
        setLastCompletedTrade(completedTrade);

        return completedTrade;

    }, [position]);

    const updateTrailingStop = useCallback((currentPrice: number) => {
        if (!position || !position.sl) return;

        const risk = Math.abs(position.entryPrice - (position.sl || 0));
        const currentReward = position.direction === 'LONG' ? (currentPrice - position.entryPrice) : (position.entryPrice - currentPrice);

        // Rule 1: Move to BE at 1:1 RR
        if (!position.isBE && currentReward >= risk) {
            setPosition(prev => prev ? { ...prev, sl: prev.entryPrice, isBE: true } : null);
        }

        // Rule 2: Trail Stop Loss (Simplified trail by 2x Risk distance once in 2R profit)
        if (currentReward >= risk * 2) {
            const newSl = position.direction === 'LONG' ? currentPrice - risk : currentPrice + risk;
            if (position.direction === 'LONG' && newSl > (position.sl || 0)) {
                setPosition(prev => prev ? { ...prev, sl: newSl } : null);
            } else if (position.direction === 'SHORT' && newSl < (position.sl || 0)) {
                setPosition(prev => prev ? { ...prev, sl: newSl } : null);
            }
        }
    }, [position]);

    return {
        position,
        tradeHistory,
        enterTrade,
        closeTrade,
        updateTrailingStop,
        lastCompletedTrade,
        setLastCompletedTrade // To clear modal if needed
    };
}
