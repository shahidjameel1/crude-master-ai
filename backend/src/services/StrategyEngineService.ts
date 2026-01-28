import { ICTSMCHybridStrategy } from '../strategies/implementations/ICTSMCHybridStrategy';
import { Candle, MarketData, AnalysisResult } from '../types';

export class StrategyEngineService {
    private strategy: ICTSMCHybridStrategy;
    private caches: Record<string, Candle[]> = {
        '1m': [],
        '5m': [],
        '15m': [],
        '1h': []
    };

    constructor() {
        this.strategy = new ICTSMCHybridStrategy();
    }

    /**
     * Update the cache for a specific timeframe
     */
    public updateCache(timeframe: string, candles: Candle[]) {
        if (this.caches[timeframe]) {
            this.caches[timeframe] = candles;
        }
    }

    /**
     * Process a new confirmed candle
     */
    public processNewCandle(timeframe: string, candle: Candle) {
        if (!this.caches[timeframe]) return;

        // Append or update last
        const cache = this.caches[timeframe];
        if (cache.length > 0 && cache[cache.length - 1].time === candle.time) {
            cache[cache.length - 1] = candle;
        } else {
            cache.push(candle);
        }

        // Trim cache to 200 candles for performance
        if (cache.length > 200) {
            this.caches[timeframe] = cache.slice(-200);
        }
    }

    /**
     * Get current cache for a timeframe
     */
    public getCache(timeframe: string): Candle[] {
        return this.caches[timeframe] || [];
    }

    /**
     * Run the full multi-timeframe analysis
     */
    public async runAnalysis(): Promise<AnalysisResult> {
        const marketData: Record<string, MarketData> = {};

        for (const [tf, candles] of Object.entries(this.caches)) {
            marketData[tf] = {
                symbol: 'CRUDEOIL', // This should be dynamic in a multi-instrument setup
                interval: tf,
                candles: candles,
                lastUpdate: new Date()
            };
        }

        try {
            return await this.strategy.analyze(marketData);
        } catch (error) {
            console.error('Strategy Engine Analysis Error:', error);
            return {
                signal: null,
                shouldTrade: false,
                explanation: 'Strategy engine internal failure',
                opportunities: []
            };
        }
    }

    public getMarketCondition() {
        // Use 15m as default for regime detection
        return this.strategy.determineMarketCondition(this.caches['15m'] || []);
    }
}

export const strategyEngine = new StrategyEngineService();
