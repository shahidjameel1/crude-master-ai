import { CandlestickData, Time } from 'lightweight-charts';

interface Tick {
    price: number;
    volume: number;
    time: number; // seconds
}

interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isLive?: boolean;
}

export class CandleFinalizationService {
    private confirmedCandles: Candle[] = [];
    private liveCandle: Candle | null = null;
    private timeframe: number; // in seconds (60 = 1m, 300 = 5m, 900 = 15m)
    private timeframeStr: string;
    private lastCandleCloseTime: number = 0;

    constructor(timeframe: '1m' | '5m' | '15m' | '1h' = '15m') {
        const timeframeMap: Record<string, number> = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600
        };
        this.timeframe = timeframeMap[timeframe];
        this.timeframeStr = timeframe;
    }

    /**
     * Initialize with historical candles from REST API
     */
    public initializeHistory(historicalCandles: Candle[]): void {
        this.confirmedCandles = historicalCandles.map(c => ({ ...c, isLive: false }));
        if (this.confirmedCandles.length > 0) {
            const lastCandle = this.confirmedCandles[this.confirmedCandles.length - 1];
            this.lastCandleCloseTime = lastCandle.time + this.timeframe;
        }
    }

    /**
     * Process incoming tick from WebSocket
     */
    public processTick(tick: Tick): { confirmedCandles: Candle[], liveCandle: Candle | null, newCandleFormed: boolean, lastConfirmed?: Candle } {
        const tickTime = tick.time;
        const candleStartTime = this.getCandleStartTime(tickTime);

        // Check if we need to finalize the current live candle
        if (this.liveCandle && candleStartTime > this.liveCandle.time) {
            this.finalizeLiveCandle();
        }

        // Create or update live candle
        if (!this.liveCandle || this.liveCandle.time !== candleStartTime) {
            this.liveCandle = {
                time: candleStartTime,
                open: tick.price,
                high: tick.price,
                low: tick.price,
                close: tick.price,
                volume: tick.volume || 0,
                isLive: true
            };
        } else {
            // Update existing live candle
            this.liveCandle.high = Math.max(this.liveCandle.high, tick.price);
            this.liveCandle.low = Math.min(this.liveCandle.low, tick.price);
            this.liveCandle.close = tick.price;
            this.liveCandle.volume += tick.volume || 0;
        }

        const newCandleFormed = this.lastCandleCloseTime !== candleStartTime + this.timeframe;
        this.lastCandleCloseTime = candleStartTime + this.timeframe;

        return {
            confirmedCandles: this.getConfirmedCandles(),
            liveCandle: this.getLiveCandle(),
            newCandleFormed,
            lastConfirmed: newCandleFormed ? this.getLastConfirmedCandle() as Candle : undefined
        };
    }

    /**
     * Finalize the current live candle and promote it to confirmed
     */
    private finalizeLiveCandle(): void {
        if (this.liveCandle) {
            const finalizedCandle = { ...this.liveCandle, isLive: false };
            this.confirmedCandles.push(finalizedCandle);
            this.liveCandle = null;
            console.log(`✅ Candle finalized at ${new Date(finalizedCandle.time * 1000).toISOString()}`);
        }
    }

    /**
     * Get candle start time for a given timestamp
     */
    private getCandleStartTime(timestamp: number): number {
        return Math.floor(timestamp / this.timeframe) * this.timeframe;
    }

    /**
     * Get all confirmed (immutable) candles
     */
    public getConfirmedCandles(): Candle[] {
        return [...this.confirmedCandles];
    }

    /**
     * Get the current live (forming) candle
     */
    public getLiveCandle(): Candle | null {
        return this.liveCandle ? { ...this.liveCandle } : null;
    }

    /**
     * Get all candles (confirmed + live) for chart display
     */
    public getAllCandles(): Candle[] {
        const all = [...this.confirmedCandles];
        if (this.liveCandle) {
            all.push({ ...this.liveCandle });
        }
        return all;
    }

    /**
     * Check if current candle is confirmed (for strategy use)
     */
    public isCurrentCandleConfirmed(): boolean {
        return this.liveCandle === null;
    }

    /**
     * Get the last confirmed candle (safe for strategy logic)
     */
    public getLastConfirmedCandle(): Candle | null {
        if (this.confirmedCandles.length === 0) return null;
        return { ...this.confirmedCandles[this.confirmedCandles.length - 1] };
    }

    public getTimeframe(): string {
        return this.timeframeStr;
    }
}
