import { useEffect, useLayoutEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface MTFSnapshotProps {
    timeframe: string;
}

function MTFSnapshot({ timeframe }: MTFSnapshotProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    useLayoutEffect(() => {
        if (!containerRef.current || chartRef.current) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 150,
            layout: { background: { color: 'transparent' }, textColor: 'rgba(255,255,255,0.4)' },
            grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
            timeScale: { visible: false },
            rightPriceScale: { visible: false },
            handleScroll: false,
            handleScale: false,
        });

        const series = chart.addCandlestickSeries({
            upColor: '#22d3ee',
            downColor: '#e5e7eb',
            borderVisible: false,
            wickUpColor: '#22d3ee',
            wickDownColor: '#e5e7eb',
        });

        chartRef.current = chart;
        seriesRef.current = series;

        return () => {
            chart.remove();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!seriesRef.current || !chartRef.current) return;

        const loadData = async () => {
            try {
                const token = localStorage.getItem('friday_auth_token');
                const response = await fetch(`/api/candles?timeframe=${timeframe}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.candles && seriesRef.current) {
                    seriesRef.current.setData(data.candles);
                    chartRef.current?.timeScale().fitContent();
                }
            } catch (e) {
                console.error(`MTF ${timeframe} error:`, e);
            }
        };

        loadData();
    }, [timeframe]);

    useEffect(() => {
        if (!containerRef.current || !chartRef.current) return;

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                chartRef.current?.applyOptions({ width, height });
                chartRef.current?.timeScale().fitContent();
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] border border-white/5 rounded-xl p-2 group hover:bg-white/[0.04] transition-all">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-accent transition-colors">{timeframe} Snapshot</span>
                <div className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent animate-pulse" />
            </div>
            <div ref={containerRef} className="flex-1 min-h-0" />
        </div>
    );
}

export function MTFPanel() {
    return (
        <div className="flex flex-col gap-2 h-full py-1">
            <MTFSnapshot timeframe="1m" />
            <MTFSnapshot timeframe="5m" />
            <MTFSnapshot timeframe="15m" />
        </div>
    );
}
