import { Candle, MarketData } from '../types';

/**
 * Demo Data Generator
 * Generates realistic MCX Crude Oil candle data for testing
 */
export class DemoDataGenerator {
    /**
     * Generate realistic candle data based on crude oil patterns
     */
    static generateSampleData(
        timeframe: string,
        numCandles: number,
        basePrice: number = 5200
    ): Candle[] {
        const candles: Candle[] = [];
        let currentPrice = basePrice;

        // Crude oil typical volatility and patterns
        const volatility = timeframe === '1m' ? 0.0005 : timeframe === '5m' ? 0.001 : 0.002;
        const trendBias = Math.random() > 0.5 ? 1 : -1; // Bullish or bearish

        for (let i = 0; i < numCandles; i++) {
            // Add some randomness and trend
            const trendComponent = trendBias * Math.random() * volatility * currentPrice;
            const randomComponent = (Math.random() - 0.5) * 2 * volatility * currentPrice;

            const open = currentPrice;
            const movement = trendComponent + randomComponent;
            const close = open + movement;

            // High/Low with spread
            const spread = Math.abs(movement) * (1 + Math.random());
            const high = Math.max(open, close) + spread * 0.5;
            const low = Math.min(open, close) - spread * 0.5;

            // Volume (realistic range for crude oil)
            const baseVolume = 1000 + Math.random() * 2000;
            const volumeSpike = Math.abs(movement) > currentPrice * volatility * 2 ? 2 : 1;
            const volume = Math.floor(baseVolume * volumeSpike);

            const date = new Date();
            date.setMinutes(date.getMinutes() - (numCandles - i));
            const time = Math.floor(date.getTime() / 1000);

            candles.push({
                time,
                open: Math.round(open * 100) / 100,
                high: Math.round(high * 100) / 100,
                low: Math.round(low * 100) / 100,
                close: Math.round(close * 100) / 100,
                volume
            });

            currentPrice = close;

            // Add occasional sharp moves (FVG creation)
            if (Math.random() > 0.95 && i > 10) {
                const gapSize = currentPrice * 0.003 * (Math.random() > 0.5 ? 1 : -1);
                currentPrice += gapSize;
            }
        }

        return candles;
    }

    /**
     * Generate multi-timeframe data
     */
    static generateMultiTimeframeData(): Record<string, MarketData> {
        const now = new Date();
        const basePrice = 5200 + (Math.random() - 0.5) * 100; // Start around 5150-5250

        return {
            '1m': {
                symbol: 'CRUDEOIL',
                interval: '1m',
                candles: this.generateSampleData('1m', 200, basePrice),
                lastUpdate: now
            },
            '5m': {
                symbol: 'CRUDEOIL',
                interval: '5m',
                candles: this.aggregateCandles(this.generateSampleData('1m', 500, basePrice), 5),
                lastUpdate: now
            },
            '15m': {
                symbol: 'CRUDEOIL',
                interval: '15m',
                candles: this.aggregateCandles(this.generateSampleData('1m', 1500, basePrice), 15),
                lastUpdate: now
            },
            '1h': {
                symbol: 'CRUDEOIL',
                interval: '1h',
                candles: this.aggregateCandles(this.generateSampleData('1m', 3000, basePrice), 60),
                lastUpdate: now
            }
        };
    }

    /**
     * Aggregate 1m candles into higher timeframes
     */
    private static aggregateCandles(candles: Candle[], ratio: number): Candle[] {
        const aggregated: Candle[] = [];

        for (let i = 0; i < candles.length; i += ratio) {
            const chunk = candles.slice(i, i + ratio);
            if (chunk.length === 0) continue;

            const open = chunk[0].open;
            const close = chunk[chunk.length - 1].close;
            const high = Math.max(...chunk.map(c => c.high));
            const low = Math.min(...chunk.map(c => c.low));
            const volume = chunk.reduce((sum, c) => sum + c.volume, 0);

            aggregated.push({
                time: chunk[0].time,
                open,
                high,
                low,
                close,
                volume
            });
        }

        return aggregated;
    }

    /**
     * Generate data with specific pattern (for testing ICT/SMC)
     */
    static generatePatternData(pattern: 'fvg' | 'liquidity_grab' | 'order_block'): MarketData {
        const baseCandles = this.generateSampleData('5m', 50, 5200);

        if (pattern === 'fvg') {
            // Insert a Fair Value Gap
            const insertIndex = 30;
            baseCandles[insertIndex].close = baseCandles[insertIndex].open + 20; // Strong up move
            baseCandles[insertIndex].high = baseCandles[insertIndex].close + 5;
            baseCandles[insertIndex + 1].open = baseCandles[insertIndex].close + 15; // Gap
            baseCandles[insertIndex + 1].low = baseCandles[insertIndex + 1].open - 5;
        }

        if (pattern === 'liquidity_grab') {
            // Insert a liquidity sweep
            const insertIndex = 35;
            const recentLow = Math.min(...baseCandles.slice(0, insertIndex).map(c => c.low));
            baseCandles[insertIndex].low = recentLow - 10; // Sweep below
            baseCandles[insertIndex].close = baseCandles[insertIndex].open + 15; // Reversal
            baseCandles[insertIndex + 1].close = baseCandles[insertIndex + 1].open + 20; // Confirmation
        }

        return {
            symbol: 'CRUDEOIL',
            interval: '5m',
            candles: baseCandles,
            lastUpdate: new Date()
        };
    }
    private currentCandles: Record<string, Candle[]> = {};

    constructor() {
        const initialData = DemoDataGenerator.generateMultiTimeframeData();
        Object.keys(initialData).forEach(tf => {
            this.currentCandles[tf] = initialData[tf].candles;
        });
    }

    public generateMockHistory(timeframe: string): Candle[] {
        return this.currentCandles[timeframe] || this.currentCandles['15m'];
    }

    public generateNextTick(): Record<string, MarketData> {
        const now = new Date();
        const output: Record<string, MarketData> = {};

        ['1m', '5m', '15m', '1h'].forEach(tf => {
            // Get last candle
            const candles = this.currentCandles[tf];
            let lastCandle = candles[candles.length - 1];

            // Simulate price movement on last candle
            const volatility = tf === '1m' ? 0.0005 : 0.002;
            const change = lastCandle.close * volatility * (Math.random() - 0.5);
            lastCandle.close += change;
            lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
            lastCandle.low = Math.min(lastCandle.low, lastCandle.close);
            lastCandle.volume += Math.floor(Math.random() * 10);

            // Check if we need to close this candle (simulate time passing)
            // For demo simplicity, we just keep updating the last candle for now, 
            // or we could add a new one every N ticks. 
            // Let's add a new 1m candle every 60 calls roughly if we assume 1s interval?
            // For now, simpler: just return the updated current state

            output[tf] = {
                symbol: 'CRUDEOIL',
                interval: tf,
                candles: [...candles], // Return copy
                lastUpdate: now
            };
        });

        return output;
    }
}
