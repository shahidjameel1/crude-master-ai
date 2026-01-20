import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts';

interface ProfessionalChartProps {
    data: any[];
    symbol?: string;
    timeframe?: string;
    onTimeframeChange?: (tf: string) => void;
}

export function ProfessionalChart({ data, symbol = "CRUDEOIL", timeframe = "15m" }: ProfessionalChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const [latestPrice, setLatestPrice] = useState<number>(0);
    const [priceChange, setPriceChange] = useState<number>(0);
    const [pricePctChange, setPricePctChange] = useState<number>(0);
    const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0 });
    const [isDrawingMode, setIsDrawingMode] = useState(false);

    // Format and Sort Data (Critical for lightweight-charts)
    const formattedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const seen = new Set();
        return data
            .map(item => ({
                time: item.time,
                open: Number(item.open),
                high: Number(item.high),
                low: Number(item.low),
                close: Number(item.close),
            }))
            .filter(item => {
                if (seen.has(item.time)) return false;
                seen.add(item.time);
                return true;
            })
            .sort((a, b) => a.time - b.time);
    }, [data]);

    const volumeData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const seen = new Set();
        return data
            .map(item => ({
                time: item.time,
                value: Number(item.volume || 100),
                color: item.close >= item.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            }))
            .filter(item => {
                if (seen.has(item.time)) return false;
                seen.add(item.time);
                return true;
            })
            .sort((a, b) => a.time - b.time);
    }, [data]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Initialize Chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#94A3B8',
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: '#3B82F6',
                    style: 2,
                    labelBackgroundColor: '#3B82F6',
                },
                horzLine: {
                    width: 1,
                    color: '#3B82F6',
                    style: 2,
                    labelBackgroundColor: '#3B82F6',
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.08)',
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 10,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.08)',
                autoScale: true,
                alignLabels: true,
            },
            handleScroll: true,
            handleScale: true,
        });

        // Candlestick Series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10B981',
            downColor: '#EF4444',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });

        // Volume Series (Overlay)
        const volumeSeries = chart.addHistogramSeries({
            color: '#3B82F6',
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Overlay on main chart
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Take bottom 20%
                bottom: 0,
            },
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Resize Logic
        const observer = new ResizeObserver(entries => {
            if (entries[0] && chartRef.current) {
                const { width, height } = entries[0].contentRect;
                chartRef.current.applyOptions({ width, height });
            }
        });
        observer.observe(chartContainerRef.current);

        return () => {
            observer.disconnect();
            chart.remove();
        };
    }, []);

    // Sync Data
    useEffect(() => {
        if (!candleSeriesRef.current || formattedData.length === 0) return;

        candleSeriesRef.current.setData(formattedData);
        if (volumeSeriesRef.current && volumeData.length > 0) {
            volumeSeriesRef.current.setData(volumeData);
        }

        const latest = formattedData[formattedData.length - 1];
        setLatestPrice(latest.close);
        setOhlc({ open: latest.open, high: latest.high, low: latest.low, close: latest.close });

        if (formattedData.length > 1) {
            const prev = formattedData[formattedData.length - 2];
            const diff = latest.close - prev.close;
            setPriceChange(diff);
            setPricePctChange((diff / prev.close) * 100);
        }
    }, [formattedData, volumeData]);

    return (
        <div className="flex flex-col h-full w-full relative bg-black/40 rounded-2xl overflow-hidden backdrop-blur-md border border-white/10 shadow-2xl">
            {/* Angel One Professional Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-5 border-b border-white/5 bg-white/[0.02] gap-4 z-20">
                <div className="flex items-center gap-5">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold font-heading tracking-tight text-white group-hover:text-accent transition-colors cursor-default">{symbol}</span>
                            <span className="text-[11px] bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-bold">MCX</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest">{timeframe} INTERVAL</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        </div>
                    </div>

                    <div className="flex flex-col border-l border-white/10 pl-5 min-w-[120px]">
                        <span className="text-3xl font-bold text-white font-mono leading-none tracking-tight">{latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <div className={`flex items-center gap-2 mt-1.5 text-xs font-bold ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
                            <span className="flex items-center">{priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}</span>
                            <span className="bg-white/5 backdrop-blur-sm px-2 py-0.5 rounded text-[10px]">{pricePctChange.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-[11px] font-mono bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-text-tertiary text-[9px] uppercase tracking-tighter mb-0.5">Open</span>
                        <span className="text-white font-bold">{ohlc.open.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4 md:pl-8">
                        <span className="text-text-tertiary text-[9px] uppercase tracking-tighter mb-0.5">High</span>
                        <span className="text-success font-bold">{ohlc.high.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4 md:pl-8">
                        <span className="text-text-tertiary text-[9px] uppercase tracking-tighter mb-0.5">Low</span>
                        <span className="text-error font-bold">{ohlc.low.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4 md:pl-8">
                        <span className="text-text-tertiary text-[9px] uppercase tracking-tighter mb-0.5">Close</span>
                        <span className="text-white font-bold">{ohlc.close.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Trading Overlay Section - Re-positioned for Visibility */}
            <div className="absolute top-32 right-6 z-30 flex flex-col gap-3">
                <button className="flex items-center justify-between gap-6 px-7 py-4 bg-success hover:bg-success/90 text-white rounded-xl font-bold shadow-xl shadow-success/30 transition-all border border-white/10 group active:scale-95">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] opacity-80 font-mono tracking-tighter">BUY MARKET</span>
                        <span className="text-base tracking-widest">LONG</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-white/20 pl-5">
                        <span className="text-xs opacity-60">QTY: 1</span>
                        <span className="text-sm font-mono">{latestPrice.toFixed(1)}</span>
                    </div>
                </button>
                <button className="flex items-center justify-between gap-6 px-7 py-4 bg-error hover:bg-error/90 text-white rounded-xl font-bold shadow-xl shadow-error/30 transition-all border border-white/10 group active:scale-95">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] opacity-80 font-mono tracking-tighter">SELL MARKET</span>
                        <span className="text-base tracking-widest">SHORT</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-white/20 pl-5">
                        <span className="text-xs opacity-60">QTY: 1</span>
                        <span className="text-sm font-mono">{latestPrice.toFixed(1)}</span>
                    </div>
                </button>
            </div>

            {/* Advanced Drawing Toolbar (Side) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 p-1.5 glass-dark rounded-xl border border-white/10">
                <button
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                    className={`p-2.5 rounded-lg transition-all ${isDrawingMode ? 'text-accent bg-accent/20' : 'text-text-tertiary hover:bg-white/5'}`} title="Drawing Mode">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button className="p-2.5 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Trendline">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4"></path></svg>
                </button>
                <button className="p-2.5 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Fibonacci">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </button>
                <div className="h-[1px] bg-white/10 mx-2 my-1" />
                <button className="p-2.5 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Delete Drawings">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>

            {/* Main Chart Area */}
            <div ref={chartContainerRef} className="flex-1 w-full min-h-[450px]" />

            {/* Professional Bottom Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-black/60 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/5">
                        {['1m', '5m', '15m', '1H', '1D'].map(tf => (
                            <button
                                key={tf}
                                className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all tracking-tighter ${timeframe === tf ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'text-text-tertiary hover:text-white'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                    <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
                    <div className="hidden md:flex items-center gap-5 text-text-tertiary">
                        <button className="hover:text-white transition-all flex items-center gap-2 text-[11px] font-bold" title="Chart Type">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            CANDLES
                        </button>
                        <button className="hover:text-white transition-all flex items-center gap-2 text-[11px] font-bold" title="Indicators">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                            INDICATORS
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-text-tertiary italic hidden sm:block">Charting by TradingView (Lightweight)</span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Screenshot">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </button>
                        <button className="p-2 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Fullscreen">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
