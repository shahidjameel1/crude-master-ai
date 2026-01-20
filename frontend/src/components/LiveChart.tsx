import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Maximize, Camera } from 'lucide-react';

interface ChartProps {
    data: any[]; // Candle data
    overlays?: {
        fvgs?: any[];
        orderBlocks?: any[];
    };
    symbol?: string;
}

export function LiveChart({ data, symbol = 'CRUDEOIL' }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const [timeframe, setTimeframe] = useState('1m');

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Initialize Chart
        const handleResize = () => {
            chartRef.current?.applyOptions({
                width: chartContainerRef.current?.clientWidth,
                height: chartContainerRef.current?.clientHeight
            });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#000000' },
                textColor: '#999',
            },
            grid: {
                vertLines: { color: '#222' },
                horzLines: { color: '#222' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: '#333',
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: '#333',
            },
        });

        chartRef.current = chart;

        // Add Candlestick Series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#00ff9d',
            downColor: '#ff3333',
            borderVisible: false,
            wickUpColor: '#00ff9d',
            wickDownColor: '#ff3333',
        });

        candleSeriesRef.current = candleSeries;

        // Load initial data
        if (data && data.length > 0) {
            candleSeries.setData(data);
        }

        // Resize observer
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update data when props change
    useEffect(() => {
        if (candleSeriesRef.current && data) {
            // Logic to update data - if it's a full replace or update
            // For now assume full replace for simplicity or check last timestamp
            candleSeriesRef.current.setData(data);

            // If we had real-time ticks, we'd use .update() here
        }
    }, [data]);

    return (
        <div className="relative w-full h-full group">
            {/* Chart Toolbar */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                {/* Symbol */}
                <div className="px-3 py-1 bg-neutral-800 rounded border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {symbol}
                </div>

                {/* Timeframes */}
                <div className="flex bg-neutral-800 rounded border border-white/10 p-0.5">
                    {['1m', '5m', '15m', '1h', 'D'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded text-xs transition-all ${timeframe === tf
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-neutral-800 rounded border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors" title="Screenshot">
                    <Camera size={16} />
                </button>
                <button className="p-2 bg-neutral-800 rounded border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors" title="Fullscreen">
                    <Maximize size={16} />
                </button>
            </div>

            {/* Chart Container */}
            <div ref={chartContainerRef} className="w-full h-full" />

            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/5 font-bold text-6xl pointer-events-none select-none">
                CRUDE-MASTER
            </div>
        </div>
    );
}
