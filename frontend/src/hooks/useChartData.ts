import { useState, useEffect, useCallback } from 'react';
import { CandlestickData, Time } from 'lightweight-charts';

interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isLive?: boolean;
}

interface CandleUpdate {
    confirmedCandles: Candle[];
    liveCandle: Candle | null;
    newCandleFormed: boolean;
}

export function useChartData(ws: WebSocket | null) {
    const [confirmedCandles, setConfirmedCandles] = useState<Candle[]>([]);
    const [liveCandle, setLiveCandle] = useState<Candle | null>(null);
    const [allCandles, setAllCandles] = useState<CandlestickData<Time>[]>([]);

    // Handle WebSocket candle updates
    useEffect(() => {
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);

            if (message.type === 'CANDLE_UPDATE') {
                const update: CandleUpdate = message.data;

                // Update confirmed candles (immutable history)
                setConfirmedCandles(update.confirmedCandles);

                // Update live candle
                setLiveCandle(update.liveCandle);

                // Combine for chart display
                const chartCandles: CandlestickData<Time>[] = update.confirmedCandles.map(c => ({
                    time: c.time as Time,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close
                }));

                // Add live candle if exists
                if (update.liveCandle) {
                    chartCandles.push({
                        time: update.liveCandle.time as Time,
                        open: update.liveCandle.open,
                        high: update.liveCandle.high,
                        low: update.liveCandle.low,
                        close: update.liveCandle.close
                    });
                }

                setAllCandles(chartCandles);

                if (update.newCandleFormed) {
                    console.log('✅ New candle formed and finalized');
                }
            }
        };

        ws.addEventListener('message', handleMessage);
        return () => ws.removeEventListener('message', handleMessage);
    }, [ws]);

    /**
     * Get confirmed candles only (for strategy logic)
     * CRITICAL: Trading logic must ONLY use this
     */
    const getConfirmedCandles = useCallback(() => {
        return confirmedCandles;
    }, [confirmedCandles]);

    /**
     * Get the last confirmed candle (safe for strategy)
     */
    const getLastConfirmedCandle = useCallback(() => {
        if (confirmedCandles.length === 0) return null;
        return confirmedCandles[confirmedCandles.length - 1];
    }, [confirmedCandles]);

    /**
     * Check if current candle is confirmed (barstate.isconfirmed equivalent)
     */
    const isCurrentCandleConfirmed = useCallback(() => {
        return liveCandle === null;
    }, [liveCandle]);

    return {
        allCandles, // For chart display
        confirmedCandles, // For strategy logic
        liveCandle, // For UI indicators
        getConfirmedCandles,
        getLastConfirmedCandle,
        isCurrentCandleConfirmed
    };
}
