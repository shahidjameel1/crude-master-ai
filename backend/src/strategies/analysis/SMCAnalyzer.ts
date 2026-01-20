import { Candle, MarketStructure, LiquidityZone, PremiumDiscountZone, PatternDetection } from '../../types';

/**
 * SMC (Smart Money Concepts) Analyzer
 * Detects BOS/CHOCH, Premium/Discount Zones, Equal Highs/Lows, Market Structure
 */
export class SMCAnalyzer {
    /**
     * Analyze Market Structure - Detect BOS (Break of Structure) and CHOCH (Change of Character)
     */
    analyzeMarketStructure(candles: Candle[]): MarketStructure {
        const higherHighs: number[] = [];
        const lowerLows: number[] = [];
        let lastBOS: number | undefined;
        let lastCHOCH: number | undefined;

        // Find swing highs and lows
        for (let i = 5; i < candles.length - 5; i++) {
            const isSwingHigh = this.isSwingHigh(candles, i, 5);
            const isSwingLow = this.isSwingLow(candles, i, 5);

            if (isSwingHigh) {
                if (higherHighs.length > 0 && candles[i].high > higherHighs[higherHighs.length - 1]) {
                    higherHighs.push(candles[i].high);
                } else if (higherHighs.length === 0) {
                    higherHighs.push(candles[i].high);
                }
            }

            if (isSwingLow) {
                if (lowerLows.length > 0 && candles[i].low < lowerLows[lowerLows.length - 1]) {
                    lowerLows.push(candles[i].low);
                } else if (lowerLows.length === 0) {
                    lowerLows.push(candles[i].low);
                }
            }
        }

        // Detect BOS: Price breaks a significant high/low in direction of trend
        const recentCandles = candles.slice(-20);
        const recentHigh = Math.max(...recentCandles.map(c => c.high));
        const recentLow = Math.min(...recentCandles.map(c => c.low));

        if (candles[candles.length - 1].close > recentHigh) {
            lastBOS = recentHigh; // Bullish BOS
        } else if (candles[candles.length - 1].close < recentLow) {
            lastBOS = recentLow; // Bearish BOS
        }

        // Detect CHOCH: Price breaks structure against the trend (potential reversal)
        const midpoint = (recentHigh + recentLow) / 2;
        if (candles[candles.length - 1].close < midpoint && candles[candles.length - 5].close > midpoint) {
            lastCHOCH = midpoint; // Bearish CHOCH
        } else if (candles[candles.length - 1].close > midpoint && candles[candles.length - 5].close < midpoint) {
            lastCHOCH = midpoint; // Bullish CHOCH
        }

        // Determine overall trend
        const trend = this.determineTrend(higherHighs, lowerLows, candles);

        return {
            trend,
            lastBOS,
            lastCHOCH,
            higherHighs,
            lowerLows
        };
    }

    private isSwingHigh(candles: Candle[], index: number, lookback: number): boolean {
        const high = candles[index].high;

        for (let i = index - lookback; i <= index + lookback; i++) {
            if (i === index || i < 0 || i >= candles.length) continue;
            if (candles[i].high > high) return false;
        }

        return true;
    }

    private isSwingLow(candles: Candle[], index: number, lookback: number): boolean {
        const low = candles[index].low;

        for (let i = index - lookback; i <= index + lookback; i++) {
            if (i === index || i < 0 || i >= candles.length) continue;
            if (candles[i].low < low) return false;
        }

        return true;
    }

    private determineTrend(
        higherHighs: number[],
        lowerLows: number[],
        candles: Candle[]
    ): 'bullish' | 'bearish' | 'neutral' {
        if (higherHighs.length >= 2 && lowerLows.length < 2) return 'bullish';
        if (lowerLows.length >= 2 && higherHighs.length < 2) return 'bearish';
        return 'neutral';
    }

    /**
     * Calculate Premium and Discount Zones (Fibonacci-based)
     * Premium: Top 50% (expensive area, good for sells)
     * Discount: Bottom 50% (cheap area, good for buys)
     */
    calculatePremiumDiscountZones(candles: Candle[], lookback: number = 50): PremiumDiscountZone {
        const recentCandles = candles.slice(-lookback);
        const high = Math.max(...recentCandles.map(c => c.high));
        const low = Math.min(...recentCandles.map(c => c.low));

        const range = high - low;
        const equilibrium = low + (range * 0.5); // 50% level
        const premiumTop = high;
        const premiumBottom = low + (range * 0.5); // 50-100%
        const discountTop = low + (range * 0.5); // 0-50%
        const discountBottom = low;

        return {
            premium: { top: premiumTop, bottom: premiumBottom },
            equilibrium,
            discount: { top: discountTop, bottom: discountBottom }
        };
    }

    /**
     * Detect Equal Highs and Equal Lows (Liquidity Pools)
     * These attract price for stop hunts
     */
    detectEqualHighsLows(candles: Candle[], tolerance: number = 0.001): LiquidityZone[] {
        const liquidityZones: LiquidityZone[] = [];
        const priceMap: Map<number, number[]> = new Map();

        // Group similar highs and lows
        for (let i = 0; i < candles.length; i++) {
            const high = Math.round(candles[i].high / 5) * 5; // Round to nearest 5 points
            const low = Math.round(candles[i].low / 5) * 5;

            if (!priceMap.has(high)) priceMap.set(high, []);
            priceMap.get(high)!.push(i);

            if (!priceMap.has(low)) priceMap.set(low, []);
            priceMap.get(low)!.push(i);
        }

        // Find levels with multiple touches (equal highs/lows)
        for (const [price, indices] of priceMap) {
            if (indices.length >= 2) {
                // Determine if it's highs or lows
                const isHigh = indices.some(i => Math.abs(candles[i].high - price) < tolerance * price);
                const isLow = indices.some(i => Math.abs(candles[i].low - price) < tolerance * price);

                if (isHigh) {
                    liquidityZones.push({
                        type: 'equal_highs',
                        price,
                        occurrences: indices.length,
                        isSwept: this.checkIfSwept(candles, price, 'high')
                    });
                }

                if (isLow) {
                    liquidityZones.push({
                        type: 'equal_lows',
                        price,
                        occurrences: indices.length,
                        isSwept: this.checkIfSwept(candles, price, 'low')
                    });
                }
            }
        }

        return liquidityZones.sort((a, b) => b.occurrences - a.occurrences);
    }

    private checkIfSwept(candles: Candle[], level: number, type: 'high' | 'low'): boolean {
        const last10 = candles.slice(-10);

        for (const candle of last10) {
            if (type === 'high' && candle.high > level) return true;
            if (type === 'low' && candle.low < level) return true;
        }

        return false;
    }

    /**
     * Detect Institutional Order Flow (Volume + Price Action)
     * High volume at key levels suggests smart money activity
     */
    detectInstitutionalOrderFlow(candles: Candle[]): PatternDetection[] {
        const orderFlow: PatternDetection[] = [];
        const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;

        for (let i = 5; i < candles.length; i++) {
            const candle = candles[i];
            const volumeRatio = candle.volume / avgVolume;

            // High volume absorption (buying/selling pressure)
            if (volumeRatio > 2) {
                const isBullishAbsorption = candle.close > candle.open && candle.close > candles[i - 1].close;
                const isBearishAbsorption = candle.close < candle.open && candle.close < candles[i - 1].close;

                if (isBullishAbsorption) {
                    orderFlow.push({
                        type: 'institutional_buying',
                        confidence: Math.min(volumeRatio / 4, 1), // Cap at 1
                        price: candle.close,
                        details: {
                            volumeRatio,
                            candleRange: candle.high - candle.low
                        }
                    });
                } else if (isBearishAbsorption) {
                    orderFlow.push({
                        type: 'institutional_selling',
                        confidence: Math.min(volumeRatio / 4, 1),
                        price: candle.close,
                        details: {
                            volumeRatio,
                            candleRange: candle.high - candle.low
                        }
                    });
                }
            }
        }

        return orderFlow;
    }

    /**
     * Determine if price is in Premium or Discount zone for entry optimization
     */
    isInPremiumZone(price: number, zones: PremiumDiscountZone): boolean {
        return price >= zones.premium.bottom && price <= zones.premium.top;
    }

    isInDiscountZone(price: number, zones: PremiumDiscountZone): boolean {
        return price >= zones.discount.bottom && price <= zones.discount.top;
    }
}
