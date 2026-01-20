import {
    Candle,
    MarketData,
    TradeSignal,
    OrderDirection,
    PatternDetection,
    MarketCondition,
    AnalysisResult
} from '../../types';
import { ICTPatternDetector } from '../analysis/ICTPatternDetector';
import { SMCAnalyzer } from '../analysis/SMCAnalyzer';

/**
 * Hybrid ICT + SMC Trading Strategy
 * Combines Fair Value Gaps, Order Blocks, Liquidity Grabs with SMC Market Structure
 */
export class ICTSMCHybridStrategy {
    private name = 'ICT+SMC Hybrid';
    private ictDetector: ICTPatternDetector;
    private smcAnalyzer: SMCAnalyzer;

    constructor() {
        this.ictDetector = new ICTPatternDetector();
        this.smcAnalyzer = new SMCAnalyzer();
    }

    /**
     * Analyze market and generate trade signal with detailed explanation
     */
    async analyze(marketData: Record<string, MarketData>): Promise<AnalysisResult> {
        const result: AnalysisResult = {
            signal: null,
            shouldTrade: false,
            explanation: '',
            opportunities: []
        };

        // Multi-timeframe analysis
        const tf1m = marketData['1m']?.candles || [];
        const tf5m = marketData['5m']?.candles || [];
        const tf15m = marketData['15m']?.candles || [];
        const tf1h = marketData['1h']?.candles || [];

        if (tf1m.length < 100 || tf5m.length < 50 || tf15m.length < 30) {
            result.explanation = 'Insufficient data for analysis';
            return result;
        }

        // Get current price
        const currentPrice = tf1m[tf1m.length - 1].close;

        // === STEP 1: Determine Higher Timeframe Bias ===
        const structure1h = this.smcAnalyzer.analyzeMarketStructure(tf1h);
        const structure15m = this.smcAnalyzer.analyzeMarketStructure(tf15m);

        const timeframeBias = {
            '1h': structure1h.trend,
            '15m': structure15m.trend,
            '5m': this.smcAnalyzer.analyzeMarketStructure(tf5m).trend,
            '1m': this.smcAnalyzer.analyzeMarketStructure(tf1m).trend
        };

        // Only trade if 1h and 15m align
        if (structure1h.trend === 'neutral' || structure15m.trend === 'neutral') {
            return null; // No clear trend
        }

        if (structure1h.trend !== structure15m.trend) {
            return null; // Timeframes not in agreement
        }

        const overallTrend = structure1h.trend;

        // === STEP 2: Detect ICT Patterns on 5m ===
        const fvgs = this.ictDetector.detectFairValueGaps(tf5m);
        const orderBlocks = this.ictDetector.detectOrderBlocks(tf5m);
        const liquidityGrabs = this.ictDetector.detectLiquidityGrabs(tf5m);

        // === STEP 3: Check Premium/Discount Zones ===
        const pdZones = this.smcAnalyzer.calculatePremiumDiscountZones(tf15m, 50);
        const inPremium = this.smcAnalyzer.isInPremiumZone(currentPrice, pdZones);
        const inDiscount = this.smcAnalyzer.isInDiscountZone(currentPrice, pdZones);

        // === STEP 4: Detect Equal Highs/Lows ===
        const liquidityZones = this.smcAnalyzer.detectEqualHighsLows(tf15m);

        // === STEP 5: Generate Signal Logic ===
        const patternsDetected: PatternDetection[] = [];
        let signal: TradeSignal | null = null;

        // BULLISH SETUP: Trend is bullish, price in discount, FVG retest or liquidity grab
        if (overallTrend === 'bullish' && inDiscount) {
            // Check for bullish FVG retest
            const recentFVG = fvgs.filter(f => f.type === 'bullish').slice(-3);

            if (recentFVG.length > 0) {
                const fvg = recentFVG[recentFVG.length - 1];
                const priceInFVG = currentPrice >= fvg.bottom && currentPrice <= fvg.top;

                if (priceInFVG) {
                    patternsDetected.push({
                        type: 'fvg_retest',
                        confidence: 0.85,
                        price: currentPrice,
                        details: { fvgTop: fvg.top, fvgBottom: fvg.bottom }
                    });

                    // Look for order block support
                    const supportOB = orderBlocks.filter(ob => ob.type === 'bullish' && ob.price < currentPrice).slice(-1)[0];
                    if (supportOB) {
                        patternsDetected.push({
                            type: 'order_block_support',
                            confidence: supportOB.strength,
                            price: supportOB.price
                        });
                    }

                    // Calculate  SL/TP
                    const stopLoss = fvg.bottom - 5; // Below FVG
                    const riskPoints = currentPrice - stopLoss;
                    const takeProfit = currentPrice + (riskPoints * 2); // 1:2 RR

                    signal = {
                        direction: OrderDirection.LONG,
                        entryPrice: currentPrice,
                        stopLoss,
                        takeProfit,
                        confidence: this.calculateConfidence(patternsDetected, timeframeBias, 'bullish'),
                        strategyName: this.name,
                        reason: `Bullish FVG retest in discount zone with ${structure1h.trend} 1H trend`,
                        patternsDetected,
                        timeframeBias,
                        riskRewardRatio: 2.0
                    };
                }
            }

            // Check for liquidity grab (sweep below equal lows)
            const bullishGrabs = liquidityGrabs.filter(lg => lg.type === 'liquidity_grab_bullish');
            if (bullishGrabs.length > 0 && !signal) {
                const grab = bullishGrabs[bullishGrabs.length - 1];

                patternsDetected.push({
                    type: 'liquidity_grab_bullish',
                    confidence: 0.80,
                    price: grab.price || currentPrice
                });

                const stopLoss = (grab.price || currentPrice) - 10;
                const riskPoints = currentPrice - stopLoss;
                const takeProfit = currentPrice + (riskPoints * 2);

                signal = {
                    direction: OrderDirection.LONG,
                    entryPrice: currentPrice,
                    stopLoss,
                    takeProfit,
                    confidence: this.calculateConfidence(patternsDetected, timeframeBias, 'bullish'),
                    strategyName: this.name,
                    reason: 'Bullish liquidity grab with reversal confirmation',
                    patternsDetected,
                    timeframeBias,
                    riskRewardRatio: 2.0
                };
            }
        }

        // BEARISH SETUP: Trend is bearish, price in premium, FVG retest or liquidity grab
        if (overallTrend === 'bearish' && inPremium && !signal) {
            // Check for bearish FVG retest
            const recentFVG = fvgs.filter(f => f.type === 'bearish').slice(-3);

            if (recentFVG.length > 0) {
                const fvg = recentFVG[recentFVG.length - 1];
                const priceInFVG = currentPrice >= fvg.bottom && currentPrice <= fvg.top;

                if (priceInFVG) {
                    patternsDetected.push({
                        type: 'fvg_retest',
                        confidence: 0.85,
                        price: currentPrice,
                        details: { fvgTop: fvg.top, fvgBottom: fvg.bottom }
                    });

                    const stopLoss = fvg.top + 5; // Above FVG
                    const riskPoints = stopLoss - currentPrice;
                    const takeProfit = currentPrice - (riskPoints * 2);

                    signal = {
                        direction: OrderDirection.SHORT,
                        entryPrice: currentPrice,
                        stopLoss,
                        takeProfit,
                        confidence: this.calculateConfidence(patternsDetected, timeframeBias, 'bearish'),
                        strategyName: this.name,
                        reason: `Bearish FVG retest in premium zone with ${structure1h.trend} 1H trend`,
                        patternsDetected,
                        timeframeBias,
                        riskRewardRatio: 2.0
                    };
                }
            }

            // Check for bearish liquidity grab
            const bearishGrabs = liquidityGrabs.filter(lg => lg.type === 'liquidity_grab_bearish');
            if (bearishGrabs.length > 0 && !signal) {
                const grab = bearishGrabs[bearishGrabs.length - 1];

                patternsDetected.push({
                    type: 'liquidity_grab_bearish',
                    confidence: 0.80,
                    price: grab.price || currentPrice
                });

                const stopLoss = (grab.price || currentPrice) + 10;
                const riskPoints = stopLoss - currentPrice;
                const takeProfit = currentPrice - (riskPoints * 2);

                signal = {
                    direction: OrderDirection.SHORT,
                    entryPrice: currentPrice,
                    stopLoss,
                    takeProfit,
                    confidence: this.calculateConfidence(patternsDetected, timeframeBias, 'bearish'),
                    strategyName: this.name,
                    reason: 'Bearish liquidity grab with reversal confirmation',
                    patternsDetected,
                    timeframeBias,
                    riskRewardRatio: 2.0
                };
            }
        }

        // Populate Opportunities for ranking
        // Bullish Potential
        const bullishScore = overallTrend === 'bullish' ? (inDiscount ? 80 : 50) : 20;
        result.opportunities.push({
            direction: OrderDirection.LONG,
            score: bullishScore,
            reason: overallTrend === 'bullish' ? 'Trend alignment' : 'Counter-trend',
            missingConditions: inDiscount ? [] : ['Price not in discount zone']
        });

        // Bearish Potential
        const bearishScore = overallTrend === 'bearish' ? (inPremium ? 80 : 50) : 20;
        result.opportunities.push({
            direction: OrderDirection.SHORT,
            score: bearishScore,
            reason: overallTrend === 'bearish' ? 'Trend alignment' : 'Counter-trend',
            missingConditions: inPremium ? [] : ['Price not in premium zone']
        });

        // Sort by score
        result.opportunities.sort((a, b) => b.score - a.score);

        if (signal && signal.confidence >= 60) {
            result.signal = signal;
            result.shouldTrade = true;
            result.explanation = `High confidence signal found: ${signal.reason}`;
            return result;
        }

        // Generate 'Why NOT' explanation if no signal
        if (!result.shouldTrade) {
            if (structure1h.trend === 'neutral') {
                result.explanation = 'Market condition is ranging/neutral (1H Trend)';
            } else if (structure1h.trend !== structure15m.trend) {
                result.explanation = `Timeframe mismatch: 1H is ${structure1h.trend} but 15M is ${structure15m.trend}`;
            } else if (overallTrend === 'bullish' && !inDiscount) {
                result.explanation = 'Bullish trend but price is in Premium (expensive) - waiting for pullback';
            } else if (overallTrend === 'bearish' && !inPremium) {
                result.explanation = 'Bearish trend but price is in Discount (cheap) - waiting for bounce';
            } else {
                result.explanation = 'No clear entry pattern (FVG/Liquidity Grab) detected at key level';
            }
        }

        return result;
    }

    /**
     * Calculate confidence score based on pattern strength and timeframe alignment
     */
    private calculateConfidence(
        patterns: PatternDetection[],
        timeframeBias: Record<string, string>,
        direction: 'bullish' | 'bearish'
    ): number {
        let confidence = 0;

        // Pattern confidence (max 50 points)
        const avgPatternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
        confidence += avgPatternConfidence * 50;

        // Timeframe alignment (max 30 points)
        const alignedTFs = Object.values(timeframeBias).filter(bias => bias === direction).length;
        confidence += (alignedTFs / 4) * 30;

        // Multiple patterns bonus (max 20 points)
        const patternBonus = Math.min(patterns.length * 5, 20);
        confidence += patternBonus;

        return Math.min(confidence, 100);
    }

    /**
     * Determine current market condition
     */
    determineMarketCondition(candles: Candle[]): MarketCondition {
        // Simple volatility check using ATR
        const atr = this.calculateATR(candles, 14);
        const avgPrice = candles.slice(-20).reduce((sum, c) => sum + c.close, 0) / 20;
        const volatilityPercent = (atr / avgPrice) * 100;

        let volatility: 'low' | 'medium' | 'high';
        if (volatilityPercent < 1) volatility = 'low';
        else if (volatilityPercent < 2) volatility = 'medium';
        else volatility = 'high';

        const structure = this.smcAnalyzer.analyzeMarketStructure(candles);

        // Session based on Indian time (simplified)
        const hour = new Date().getHours();
        let session: MarketCondition['session'];
        if (hour < 9) session = 'closed';
        else if (hour < 12) session = 'morning';
        else if (hour < 17) session = 'afternoon';
        else if (hour < 22) session = 'evening';
        else session = 'closed';

        return {
            trend: structure.trend,
            volatility,
            session,
            regime: volatility === 'high' ? 'breakout' : structure.trend === 'neutral' ? 'ranging' : 'trending',
            atr
        };
    }

    private calculateATR(candles: Candle[], period: number): number {
        const trs: number[] = [];

        for (let i = 1; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = candles[i - 1].close;

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );

            trs.push(tr);
        }

        const recentTRs = trs.slice(-period);
        return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
    }
}
