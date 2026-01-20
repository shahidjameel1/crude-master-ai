import { Candle, FairValueGap, OrderBlock, PatternDetection } from '../../types';

/**
 * ICT (Inner Circle Trader) Pattern Detector
 * Detects Fair Value Gaps, Order Blocks, Breaker Blocks, and Liquidity Grabs
 */
export class ICTPatternDetector {
    /**
     * Detect Fair Value Gaps (FVG) - Imbalance zones
     * A bullish FVG occurs when candle[i-2].high < candle[i].low (gap between)
     * A bearish FVG occurs when candle[i-2].low > candle[i].high
     */
    detectFairValueGaps(candles: Candle[]): FairValueGap[] {
        const fvgs: FairValueGap[] = [];

        for (let i = 2; i < candles.length; i++) {
            const current = candles[i];
            const previous = candles[i - 1];
            const twoBefore = candles[i - 2];

            // Bullish FVG: Gap up (previous candle's high < current candle's low)
            if (twoBefore.high < current.low) {
                fvgs.push({
                    type: 'bullish',
                    top: current.low,
                    bottom: twoBefore.high,
                    candleIndex: i,
                    isFilled: false
                });
            }

            // Bearish FVG: Gap down (previous candle's low > current candle's high)
            if (twoBefore.low > current.high) {
                fvgs.push({
                    type: 'bearish',
                    top: twoBefore.low,
                    bottom: current.high,
                    candleIndex: i,
                    isFilled: false
                });
            }
        }

        // Check if FVGs have been filled
        this.markFilledFVGs(fvgs, candles);

        return fvgs.filter(fvg => !fvg.isFilled); // Return only unfilled FVGs
    }

    private markFilledFVGs(fvgs: FairValueGap[], candles: Candle[]): void {
        for (const fvg of fvgs) {
            for (let i = fvg.candleIndex + 1; i < candles.length; i++) {
                const candle = candles[i];

                if (fvg.type === 'bullish') {
                    // FVG is filled if price retraces into the gap
                    if (candle.low <= fvg.top && candle.low >= fvg.bottom) {
                        fvg.isFilled = true;
                        break;
                    }
                } else {
                    // Bearish FVG
                    if (candle.high >= fvg.bottom && candle.high <= fvg.top) {
                        fvg.isFilled = true;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Detect Order Blocks - Last bullish/bearish candle before strong move
     * Identifies institutional accumulation/distribution zones
     */
    detectOrderBlocks(candles: Candle[], lookback: number = 20): OrderBlock[] {
        const orderBlocks: OrderBlock[] = [];

        for (let i = 2; i < candles.length; i++) {
            const current = candles[i];
            const previous = candles[i - 1];
            const twoBefore = candles[i - 2];

            // Bullish Order Block: Last down candle before strong up move
            const isBullishOB =
                twoBefore.close < twoBefore.open && // Down candle
                previous.close > previous.open && // Up candle
                current.close > current.open && // Up candle
                current.close > twoBefore.high; // Strong breakout

            if (isBullishOB) {
                const strength = this.calculateOrderBlockStrength(candles, i, 'bullish');
                orderBlocks.push({
                    type: 'bullish',
                    price: twoBefore.low, // Support zone at OB low
                    candleIndex: i - 2,
                    strength
                });
            }

            // Bearish Order Block: Last up candle before strong down move
            const isBearishOB =
                twoBefore.close > twoBefore.open && // Up candle
                previous.close < previous.open && // Down candle
                current.close < current.open && // Down candle
                current.close < twoBefore.low; // Strong breakdown

            if (isBearishOB) {
                const strength = this.calculateOrderBlockStrength(candles, i, 'bearish');
                orderBlocks.push({
                    type: 'bearish',
                    price: twoBefore.high, // Resistance zone at OB high
                    candleIndex: i - 2,
                    strength
                });
            }
        }

        return orderBlocks;
    }

    private calculateOrderBlockStrength(
        candles: Candle[],
        index: number,
        type: 'bullish' | 'bearish'
    ): number {
        // Strength based on volume and subsequent price action
        const obCandle = candles[index - 2];
        const avgVolume = this.getAverageVolume(candles, index - 10, 10);

        let volumeStrength = Math.min(obCandle.volume / avgVolume, 2) / 2; // 0-1

        // Check if price respected the OB (didn't break through)
        let respectedCount = 0;
        for (let i = index; i < Math.min(index + 10, candles.length); i++) {
            const candle = candles[i];
            if (type === 'bullish' && candle.low >= obCandle.low) respectedCount++;
            if (type === 'bearish' && candle.high <= obCandle.high) respectedCount++;
        }

        const respectStrength = respectedCount / 10; // 0-1

        return (volumeStrength + respectStrength) / 2;
    }

    private getAverageVolume(candles: Candle[], startIndex: number, count: number): number {
        const validStart = Math.max(0, startIndex);
        const validEnd = Math.min(validStart + count, candles.length);

        let sum = 0;
        for (let i = validStart; i < validEnd; i++) {
            sum += candles[i].volume;
        }

        return sum / (validEnd - validStart);
    }

    /**
     * Detect Liquidity Grabs (Inducements)
     * When price sweeps a key level (stop loss hunt) then reverses
     */
    detectLiquidityGrabs(candles: Candle[], lookback: number = 50): PatternDetection[] {
        const grabs: PatternDetection[] = [];

        for (let i = lookback; i < candles.length - 3; i++) {
            const recentHigh = this.getHighest(candles, i - lookback, i);
            const recentLow = this.getLowest(candles, i - lookback, i);

            const current = candles[i];
            const next1 = candles[i + 1];
            const next2 = candles[i + 2];

            // Bullish Liquidity Grab: Sweep below recent low, then reverse up
            const isBullishGrab =
                current.low < recentLow.price && // Sweep low
                next1.close > current.high && // Reversal
                next2.close > next1.close; // Confirmation

            if (isBullishGrab) {
                grabs.push({
                    type: 'liquidity_grab_bullish',
                    confidence: 0.75,
                    price: current.low,
                    details: {
                        sweptLevel: recentLow.price,
                        reversalStrength: (next2.close - current.low) / current.low
                    }
                });
            }

            // Bearish Liquidity Grab: Sweep above recent high, then reverse down
            const isBearishGrab =
                current.high > recentHigh.price && // Sweep high
                next1.close < current.low && // Reversal
                next2.close < next1.close; // Confirmation

            if (isBearishGrab) {
                grabs.push({
                    type: 'liquidity_grab_bearish',
                    confidence: 0.75,
                    price: current.high,
                    details: {
                        sweptLevel: recentHigh.price,
                        reversalStrength: (current.high - next2.close) / current.high
                    }
                });
            }
        }

        return grabs;
    }

    private getHighest(candles: Candle[], start: number, end: number): { price: number; index: number } {
        let highest = { price: -Infinity, index: start };
        for (let i = start; i < end; i++) {
            if (candles[i].high > highest.price) {
                highest = { price: candles[i].high, index: i };
            }
        }
        return highest;
    }

    private getLowest(candles: Candle[], start: number, end: number): { price: number; index: number } {
        let lowest = { price: Infinity, index: start };
        for (let i = start; i < end; i++) {
            if (candles[i].low < lowest.price) {
                lowest = { price: candles[i].low, index: i };
            }
        }
        return lowest;
    }

    /**
     * Detect Breaker Blocks - Failed support becomes resistance (and vice versa)
     */
    detectBreakerBlocks(candles: Candle[]): PatternDetection[] {
        const breakerBlocks: PatternDetection[] = [];

        // Look for support that broke and became resistance
        for (let i = 20; i < candles.length - 5; i++) {
            const supportLevel = this.findSupportLevel(candles, i - 20, i);

            if (supportLevel) {
                // Check if support was broken
                for (let j = i; j < Math.min(i + 10, candles.length); j++) {
                    if (candles[j].close < supportLevel.price) {
                        // Support broken, now check if it acts as resistance
                        for (let k = j + 1; k < Math.min(j + 10, candles.length); k++) {
                            const candle = candles[k];
                            const priceNearLevel = Math.abs(candle.high - supportLevel.price) / supportLevel.price < 0.002;

                            if (priceNearLevel && candle.close < candle.open) {
                                // Rejection from old support (now resistance)
                                breakerBlocks.push({
                                    type: 'breaker_block_bearish',
                                    confidence: 0.70,
                                    price: supportLevel.price,
                                    details: { brokenAt: j, rejectedAt: k }
                                });
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }

        return breakerBlocks;
    }

    private findSupportLevel(candles: Candle[], start: number, end: number): { price: number; touches: number } | null {
        // Simplified support detection: find price level with multiple touches
        const levels: Map<number, number> = new Map();

        for (let i = start; i < end; i++) {
            const low = Math.round(candles[i].low / 10) * 10; // Round to nearest 10
            levels.set(low, (levels.get(low) || 0) + 1);
        }

        // Find level with most touches
        let bestLevel: { price: number; touches: number } | null = null;
        for (const [price, touches] of levels) {
            if (touches >= 2 && (!bestLevel || touches > bestLevel.touches)) {
                bestLevel = { price, touches };
            }
        }

        return bestLevel;
    }
}
