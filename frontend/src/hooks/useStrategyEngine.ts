import { useState, useEffect, useCallback, useMemo } from 'react';
import { CandlestickData } from 'lightweight-charts';
import { useStore } from '../store/useStore';

export interface MarketState {
    price: number;
    vwap: number;
    trend: 'UP' | 'DOWN' | 'SIDEWAYS';
    confluenceScore: number;
    isKillZone: boolean;
    riskStatus: 'SAFE' | 'RISKY';
    activeSignal: 'BUY' | 'SELL' | null;
    signalReason: string | null;

    // Institutional Breakdown
    breakdown: {
        vwapAlignment: number;      // Location (20)
        emaTrend: number;           // Trend (20)
        structure: number;          // Structure (20)
        momentum: number;           // Momentum (15)
        timing: number;             // Timing (10)
        riskQuality: number;        // Risk (15)
    };
}

interface UseStrategyEngineProps {
    currentPrice: number;
    candles: CandlestickData[];
    vwap: number;
    sessionHigh: number;
    sessionLow: number;
}

export function useStrategyEngine({
    currentPrice,
    candles,
    vwap,
    sessionHigh,
    sessionLow
}: UseStrategyEngineProps) {

    const { strategies } = useStore();

    // Engine State
    const [marketState, setMarketState] = useState<MarketState>({
        price: 0,
        vwap: 0,
        trend: 'SIDEWAYS',
        confluenceScore: 0,
        isKillZone: false,
        riskStatus: 'SAFE',
        activeSignal: null,
        signalReason: null,
        breakdown: {
            vwapAlignment: 0,
            emaTrend: 0,
            structure: 0,
            momentum: 0,
            timing: 0,
            riskQuality: 0
        }
    });

    // --- HELPER FUNCTIONS ---

    const checkKillZone = useCallback((): boolean => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeVal = hours * 100 + minutes;

        // 12:30 to 14:00 (Lunch Lull Kill Zone)
        if (timeVal >= 1230 && timeVal < 1400) return true;

        return false;
    }, []);

    const calculateConfluenceScore = useCallback(() => {
        const breakdownValues = {
            vwapAlignment: 0,      // Location (20)
            emaTrend: 0,           // Trend (20)
            structure: 0,          // Structure (20)
            momentum: 0,           // Momentum (15)
            timing: 0,             // Timing (10)
            riskQuality: 0         // Risk (15)
        };
        const reasons: string[] = [];

        // Helper
        const getWeight = (id: string) => {
            const s = strategies.find(strat => strat.id === id);
            return (s && s.enabled) ? s.weight : 0;
        };

        // A. Trend Context (Max 20)
        // HTF (1H/30m) trend aligned (+10) + LTF (5m/15m) structure aligned (+10)
        const trendWeight = getWeight('trend');
        const halfTrend = trendWeight / 2;
        // Simplifying: Price > VWAP covers LTF bullishness logic typically
        if (currentPrice > vwap) {
            breakdownValues.emaTrend += halfTrend * 2; // Assuming active trend
            reasons.push("Trend: Aligned");
        }

        // B. Location Quality (Max 20)
        // Price near VWAP (+10) + Premium/Discount (+10)
        const locWeight = getWeight('location');
        const halfLoc = locWeight / 2;

        const distFromVwap = Math.abs((currentPrice - vwap) / vwap) * 100;
        if (distFromVwap < 0.25) { // 0.25% proximity
            breakdownValues.vwapAlignment += halfLoc;
            reasons.push("Loc: Near VWAP");
        }

        const sessionRange = sessionHigh - sessionLow;
        if (sessionRange > 0) {
            const discountLevel = sessionLow + (sessionRange * 0.4);
            const premiumLevel = sessionHigh - (sessionRange * 0.4);
            if (currentPrice < discountLevel) {
                breakdownValues.vwapAlignment += halfLoc;
                reasons.push("Loc: Discount Zone");
            } else if (currentPrice > premiumLevel) {
                // If shorting, this would be good, but we are just checking quality
            }
        }

        // C. Structure & Liquidity (Max 20)
        // Break + Retest (+10) + Liquidity sweep (+10)
        const structWeight = getWeight('structure');
        // Placeholder: Needs real zigzag/swing logic. Giving partial credit for clean candles.
        if (candles.length > 5 && candles[candles.length - 1].close > candles[candles.length - 2].high) {
            breakdownValues.structure += (structWeight / 2); // Momentum breakout proxy
            reasons.push("Struct: Breakout");
        }

        // D. Momentum Confirmation (Max 15)
        // Impulse candle (+10) + RSI regime (+5)
        const momWeight = getWeight('momentum');
        const lastCandle = candles[candles.length - 1];
        if (lastCandle && Math.abs(lastCandle.close - lastCandle.open) > (currentPrice * 0.0005)) { // 0.05% move
            breakdownValues.momentum += (momWeight * 0.66);
            reasons.push("Mom: Impulse");
        }

        // E. Timing & Session (Max 10)
        // London/NY Open (+5) + Post-consolidation (+5) - Lunch Chop (-10)
        const timeWeight = getWeight('timing');
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const timeVal = h * 100 + m;

        // Lunch Chop Penalty (12:30 - 14:00)
        if (timeVal >= 1230 && timeVal < 1400) {
            breakdownValues.timing -= 10;
            reasons.push("Time: LUNCH CHOP");
        } else {
            // Session Active (14:00 - 22:00)
            if (timeVal >= 1400 && timeVal <= 2200) {
                breakdownValues.timing += (timeWeight);
                reasons.push("Time: Active Session");
            }
        }

        // F. Risk Quality (Max 15)
        // SL < 20 pts (+10) + R:R >= 1:2 (+5)
        const riskWeight = getWeight('risk');
        // Assuming hypothetical trade parameters for scoring
        breakdownValues.riskQuality += riskWeight; // Assume good risk in pre-check
        reasons.push("Risk: Acceptable");

        let totalScore = Object.values(breakdownValues).reduce((a, b) => a + b, 0);
        totalScore = Math.max(0, Math.min(100, totalScore));

        return { score: totalScore, breakdown: breakdownValues, reasons };
    }, [currentPrice, vwap, sessionHigh, sessionLow, strategies]);


    // --- MAIN ENGINE LOOP ---
    const metrics = useMemo(() => {
        if (!currentPrice || candles.length < 2) {
            return {
                isKillZone: false,
                riskStatus: 'SAFE' as const,
                score: 0,
                breakdown: {
                    vwapAlignment: 0,
                    emaTrend: 0,
                    structure: 0,
                    momentum: 0,
                    timing: 0,
                    riskQuality: 0
                },
                reasons: []
            };
        }

        const isKillZone = checkKillZone();
        const riskStatus: 'SAFE' | 'RISKY' = 'SAFE';
        const { score, breakdown, reasons } = calculateConfluenceScore();

        return { isKillZone, riskStatus, score, breakdown, reasons };
    }, [currentPrice, candles.length, checkKillZone, calculateConfluenceScore]);


    useEffect(() => {
        const { isKillZone, riskStatus, score, reasons, breakdown } = metrics;

        let activeSignal: 'BUY' | 'SELL' | null = null;
        let signalReason: string | null = null;

        if (!isKillZone && riskStatus === 'SAFE') {
            if (score >= 80) { // Automation High Quality Limit
                activeSignal = 'BUY';
                signalReason = reasons.join(', ');
            }
        }

        setMarketState({
            price: currentPrice,
            vwap,
            trend: currentPrice > vwap ? 'UP' : 'DOWN',
            confluenceScore: score,
            isKillZone,
            riskStatus,
            activeSignal,
            signalReason,
            breakdown
        });

    }, [currentPrice, vwap, metrics]);

    return {
        marketState
    };
}
