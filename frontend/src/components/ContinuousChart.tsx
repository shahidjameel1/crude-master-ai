import { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useStore, Drawing } from '../store/useStore';
import { getChart } from '../hooks/useChartSingleton';
import { VolumetricChart3D } from './VolumetricChart3D';
import { TradeReportModal } from './TradeReportModal';
import { MTFPanel } from './MTFPanel';

interface ContinuousChartProps {
    paperTrading: any;
}

export function ContinuousChart({ paperTrading }: ContinuousChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const priceLinesRef = useRef<Map<string, any>>(new Map());
    const wsRef = useRef<WebSocket | null>(null);


    // Zustand Store
    const {
        updatePrice,
        setMarketData,
        is3DMode,
        isInsightDrawerOpen,
        candles,
        activeTimeframe,
        activeTab,
        setUI,
        confluenceScore,
        volumeProfile,
        drawings,
        activeDrawingTool,
        pendingTrade
    } = useStore();

    const {
        position,
        lastCompletedTrade,
        setLastCompletedTrade,
        updateTrailingStop
    } = paperTrading;

    const loadHistoricalData = useCallback(async () => {
        if (!candleSeriesRef.current) return;
        try {
            const response = await fetch(`http://localhost:3002/api/candles?timeframe=${activeTimeframe}`);
            const data = await response.json();

            if (data.candles && Array.isArray(data.candles)) {
                candleSeriesRef.current.setData(data.candles);

                const volumeData = data.candles.map((c: any) => ({
                    time: c.time,
                    value: c.volume || 0,
                    color: c.close >= c.open ? '#00D1FF' : '#E0E0E0',
                }));
                volumeSeriesRef.current?.setData(volumeData);

                const vwapData: any[] = [];
                let cumTPV = 0, cumVol = 0, lastDateStr = '';
                let sHigh = -Infinity, sLow = Infinity, sOpen = 0;
                let pH = -Infinity, pL = Infinity;
                let tH = -Infinity, tL = Infinity;

                data.candles.forEach((candle: any) => {
                    const date = new Date(candle.time * 1000);
                    const dayStr = date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];

                    if (dayStr !== lastDateStr) {
                        cumTPV = 0; cumVol = 0;
                        if (lastDateStr !== '') { pH = tH; pL = tL; }
                        tH = -Infinity; tL = Infinity;
                        sOpen = candle.open;
                        lastDateStr = dayStr;
                    }
                    tH = Math.max(tH, candle.high);
                    tL = Math.min(tL, candle.low);
                    sHigh = tH;
                    sLow = tL;

                    const tp = (candle.high + candle.low + candle.close) / 3;
                    cumTPV += tp * candle.volume;
                    cumVol += candle.volume;
                    if (cumVol > 0) vwapData.push({ time: candle.time, value: cumTPV / cumVol });
                });

                if (vwapData.length > 0) vwapSeriesRef.current?.setData(vwapData);

                // Volume Profile (VPVR) Calculation
                const calculateVPVR = () => {
                    const chart = chartRef.current;
                    if (!chart) return [];

                    const visibleRange = chart.timeScale().getVisibleLogicalRange();
                    if (!visibleRange) return [];

                    const visibleIndices = data.candles.filter((_: any, i: number) => i >= visibleRange.from && i <= visibleRange.to);
                    if (visibleIndices.length === 0) return [];

                    const binSize = 1.0;
                    const bins: Record<number, number> = {};
                    let maxVol = 0;

                    visibleIndices.forEach((c: any) => {
                        const price = Math.floor(c.close / binSize) * binSize;
                        bins[price] = (bins[price] || 0) + (c.volume || 0);
                        if (bins[price] > maxVol) maxVol = bins[price];
                    });

                    return Object.entries(bins).map(([price, vol]) => ({
                        price: parseFloat(price),
                        volume: (vol as number) / maxVol,
                        color: parseFloat(price) >= data.candles[data.candles.length - 1].close ? 'rgba(0, 209, 255, 0.2)' : 'rgba(224, 224, 224, 0.2)'
                    }));
                };

                setMarketData({
                    candles: data.candles,
                    sessionHigh: sHigh,
                    sessionLow: sLow,
                    vwap: vwapData.length > 0 ? vwapData[vwapData.length - 1].value : 0,
                    currentPrice: data.candles[data.candles.length - 1].close,
                    volumeProfile: calculateVPVR()
                });

                // Clear and Redraw Lines
                priceLinesRef.current.forEach((line: any) => candleSeriesRef.current?.removePriceLine(line));
                priceLinesRef.current.clear();

                const createLine = (title: string, price: number, color: string, style: number) => {
                    const line = candleSeriesRef.current?.createPriceLine({
                        price, color, lineWidth: 1, lineStyle: style, title, axisLabelVisible: true
                    });
                    if (line) priceLinesRef.current.set(title, line);
                };

                if (sOpen > 0) {
                    createLine('Session High', sHigh, '#00D1FF', 2);
                    createLine('Session Low', sLow, '#f97316', 2);
                    createLine('Open', sOpen, '#ffffff', 1);
                }
                if (pH > -Infinity) {
                    createLine('PDH', pH, '#64748b', 3);
                    createLine('PDL', pL, '#64748b', 3);
                }

                chartRef.current?.timeScale().fitContent();
            }
        } catch (error) {
            console.error('Failed to load historical data:', error);
        }
    }, [activeTimeframe, setMarketData]);

    const connectWS = useCallback(() => {
        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        let lastVolume = 0;
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'PRICE_UPDATE') {
                    const tick = message.data;
                    const time = Math.floor(tick.timestamp / 1000 / 60) * 60;

                    const state = useStore.getState();
                    let cH = state.sessionHigh;
                    let cL = state.sessionLow;

                    if (tick.price > cH) { cH = tick.price; setMarketData({ sessionHigh: cH }); }
                    if (tick.price < cL) { cL = tick.price; setMarketData({ sessionLow: cL }); }

                    const tickVol = tick.volume - lastVolume;
                    if (tickVol > 0) {
                        const vwapVal = tick.price;
                        vwapSeriesRef.current?.update({ time: time as any, value: vwapVal });
                        updatePrice(tick.price, vwapVal, state.candles);

                        // Active Position Monitoring (Trailing Stop)
                        if (position) {
                            updateTrailingStop(tick.price);
                        }
                    }

                    const candle = { time: time as Time, open: tick.price, high: tick.price, low: tick.price, close: tick.price };
                    candleSeriesRef.current?.update(candle as any);

                    if (tick.volume) {
                        volumeSeriesRef.current?.update({
                            time: time as any, value: tick.volume - lastVolume,
                            color: tick.price >= candle.open ? '#00D1FF' : '#E0E0E0'
                        });
                        lastVolume = tick.volume;
                    }
                }
            } catch (e) { console.error('WS MSG Error', e); }
        };
    }, [setMarketData, updatePrice]);

    useLayoutEffect(() => {
        if (!chartContainerRef.current) return;

        // Locked Singleton Initialization
        const chart = getChart(chartContainerRef.current);
        chartRef.current = chart;

        if (!candleSeriesRef.current) {
            candleSeriesRef.current = chart.addCandlestickSeries({
                upColor: '#22d3ee',     // teal bullish
                downColor: '#e5e7eb',   // white bearish
                wickUpColor: '#22d3ee',
                wickDownColor: '#e5e7eb',
                borderVisible: false,
            });
            volumeSeriesRef.current = chart.addHistogramSeries({ color: '#3B82F6', priceFormat: { type: 'volume' }, priceScaleId: '' });
            vwapSeriesRef.current = chart.addLineSeries({ color: '#8B5CF6', lineWidth: 2, priceLineVisible: false });
        }

        loadHistoricalData();

        // No remove() call here to keep it "MOUNTED FOREVER"
    }, [loadHistoricalData]);

    // RULE 6: TAB / MODE PROTECTION
    useEffect(() => {
        if (!chartRef.current) return;

        requestAnimationFrame(() => {
            chartRef.current?.timeScale().fitContent();
        });
    }, [activeTab]);

    useEffect(() => {
        if (chartRef.current) chartRef.current.timeScale().fitContent();
    }, [activeTab]);

    useEffect(() => {
        if (!candleSeriesRef.current) return;
        const markers: any[] = [];
        if (confluenceScore >= 80) {
            const lastCandle = candles[candles.length - 1];
            if (lastCandle) {
                markers.push({
                    time: lastCandle.time, position: 'belowBar', color: '#00E676', shape: 'arrowUp', text: 'AI SIG'
                });
            }
        }
        candleSeriesRef.current.setMarkers(markers);
    }, [candles, confluenceScore]);

    useEffect(() => {
        if (!chartContainerRef.current || !chartRef.current) return;

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                chartRef.current?.applyOptions({ width, height });
                chartRef.current?.timeScale().fitContent();
            }
        });

        observer.observe(chartContainerRef.current);
        connectWS();

        return () => {
            if (wsRef.current) wsRef.current.close();
            observer.disconnect();
        };
    }, [connectWS]);

    return (
        <div className="w-full h-full flex flex-col min-h-0 relative">
            {/* Shaded Premium/Discount Zones Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
                <div style={{ height: '40%', bottom: 0 }} className="absolute inset-x-0 bg-green-500" />
                <div style={{ height: '40%', top: 0 }} className="absolute inset-x-0 bg-red-500" />
            </div>

            {/* AI Insight Drawer Overlay */}
            <div className={`absolute top-4 right-4 z-50 transition-all duration-500 transform ${isInsightDrawerOpen ? 'translate-x-0' : 'translate-x-[120%] opacity-0'}`}>
                <div className="p-4 bg-black/80 border border-white/10 rounded-2xl w-64 backdrop-blur-xl">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Institutional Pulse</h3>
                    <p className="text-[11px] text-white/60 leading-relaxed italic">"Market structure shows high confluence at current levels. Risk-gated execution favored."</p>
                </div>
            </div>

            {/* Main Chart Workspace */}
            <div className="flex-1 min-h-0 relative w-full h-full z-10 flex">
                <div className="flex-1 relative">
                    {is3DMode ? (
                        <div className="absolute inset-0 p-4"><VolumetricChart3D /></div>
                    ) : (
                        <div ref={chartContainerRef} className="chart-root" />
                    )}
                </div>

                <VolumeProfileOverlay
                    profile={volumeProfile}
                    chart={chartRef.current}
                    series={candleSeriesRef.current}
                />

                {/* MTF Snapshot Panel (Right Overlay) */}
                <div className="w-48 h-full bg-black/40 border-l border-white/5 p-2 hidden lg:flex flex-col">
                    <MTFPanel />
                </div>
            </div>

            <DrawingOverlay
                drawings={drawings}
                activeTool={activeDrawingTool}
                chart={chartRef.current}
                series={candleSeriesRef.current}
                onDrawingComplete={(drawing: Drawing) => setUI({ drawings: [...drawings, drawing], activeDrawingTool: null })}
            />

            {pendingTrade && (
                <RRVisualizerOverlay
                    intent={pendingTrade}
                    chart={chartRef.current}
                    series={candleSeriesRef.current}
                />
            )}

            {position && (
                <OpenPositionOverlay
                    position={position}
                    chart={chartRef.current}
                    series={candleSeriesRef.current}
                />
            )}

            {/* Timeframe Selector Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex bg-black/60 p-1 rounded-full border border-white/5 shadow-2xl">
                {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setUI({ activeTimeframe: tf })}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${activeTimeframe === tf ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            {/* Drawing Tools Sidebar */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                {[
                    { id: 'TRENDLINE', icon: '/' },
                    { id: 'HORIZONTAL', icon: '―' },
                    { id: 'RECTANGLE', icon: '□' },
                    { id: 'FIBONACCI', icon: '≡' }
                ].map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setUI({ activeDrawingTool: activeDrawingTool === tool.id ? null : (tool.id as any) })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${activeDrawingTool === tool.id ? 'bg-accent text-white shadow-blue-glow' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        {tool.icon}
                    </button>
                ))}
                <div className="h-px bg-white/5 mx-2 my-1" />
                <button
                    onClick={() => setUI({ drawings: [] })}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all font-black"
                >×
                </button>
            </div>

            {lastCompletedTrade && (
                <TradeReportModal trade={lastCompletedTrade} onClose={() => setLastCompletedTrade(null)} />
            )}
        </div>
    );
}

function VolumeProfileOverlay({ profile, chart, series }: { profile: any[], chart: IChartApi | null, series: ISeriesApi<'Candlestick'> | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!canvasRef.current || !chart || !series || !profile || !profile.length) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const updateCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const width = canvas.width;
            profile.forEach(bin => {
                const y = series.priceToCoordinate(bin.price);
                if (y !== null) {
                    const barWidth = bin.volume * (width * 0.3);
                    ctx.fillStyle = bin.color; ctx.fillRect(width - barWidth, y - 1, barWidth, 2);
                }
            });
        };
        const timer = setTimeout(updateCanvas, 100);
        return () => clearTimeout(timer);
    }, [profile, chart, series]);
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />;
}

function DrawingOverlay({ drawings, activeTool, chart, series, onDrawingComplete }: { drawings: Drawing[], activeTool: any, chart: IChartApi | null, series: ISeriesApi<'Candlestick'> | null, onDrawingComplete: (d: Drawing) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<{ time: number; price: number }[]>([]);

    useEffect(() => {
        if (!canvasRef.current || !chart || !series) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleClick = (e: MouseEvent) => {
            if (!activeTool) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const time = chart.timeScale().coordinateToTime(x);
            const price = series.coordinateToPrice(y);
            if (time && price) {
                const newPoint = { time: Number(time), price };
                const newPoints = [...points, newPoint];
                if (activeTool === 'HORIZONTAL') {
                    onDrawingComplete({ id: Math.random().toString(), type: 'HORIZONTAL', points: [newPoint], color: '#00D1FF' });
                    setPoints([]);
                } else if (newPoints.length === 2) {
                    onDrawingComplete({ id: Math.random().toString(), type: activeTool, points: newPoints, color: '#00D1FF' });
                    setPoints([]);
                } else { setPoints(newPoints); }
            }
        };

        const render = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawings.forEach(d => {
                ctx.strokeStyle = d.color; ctx.fillStyle = d.color + '22'; ctx.lineWidth = 1;
                if (d.type === 'HORIZONTAL') {
                    const y = series.priceToCoordinate(d.points[0].price);
                    if (y !== null) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
                } else if ((d.type === 'TRENDLINE' || d.type === 'FIBONACCI') && d.points.length === 2) {
                    const x1 = chart.timeScale().timeToCoordinate(d.points[0].time as any);
                    const y1 = series.priceToCoordinate(d.points[0].price);
                    const x2 = chart.timeScale().timeToCoordinate(d.points[1].time as any);
                    const y2 = series.priceToCoordinate(d.points[1].price);
                    if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
                } else if (d.type === 'RECTANGLE' && d.points.length === 2) {
                    const x1 = chart.timeScale().timeToCoordinate(d.points[0].time as any);
                    const y1 = series.priceToCoordinate(d.points[0].price);
                    const x2 = chart.timeScale().timeToCoordinate(d.points[1].time as any);
                    const y2 = series.priceToCoordinate(d.points[1].price);
                    if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) { ctx.fillRect(x1, y1, x2 - x1, y2 - y1); ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); }
                }
            });
        };
        canvas.parentElement?.addEventListener('click', handleClick);
        const interval = setInterval(render, 100);
        return () => {
            canvas.parentElement?.removeEventListener('click', handleClick);
            clearInterval(interval);
        };
    }, [drawings, activeTool, chart, series, points, onDrawingComplete]);

    return <canvas ref={canvasRef} className={`absolute inset-0 z-30 ${activeTool ? 'cursor-crosshair' : 'pointer-events-none'}`} />;
}

function RRVisualizerOverlay({ intent, chart, series }: { intent: any, chart: IChartApi | null, series: ISeriesApi<'Candlestick', Time> | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !chart || !series) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const entryY = series.priceToCoordinate(intent.price);
            const slY = series.priceToCoordinate(intent.suggestedSL);
            const tpY = series.priceToCoordinate(intent.suggestedTP);

            if (entryY !== null && slY !== null && tpY !== null) {
                // Background Area
                ctx.fillStyle = intent.side === 'BUY' ? 'rgba(74, 222, 128, 0.05)' : 'rgba(248, 113, 113, 0.05)';
                const top = Math.min(entryY, tpY, slY);
                const bottom = Math.max(entryY, tpY, slY);
                ctx.fillRect(0, top, canvas.width, bottom - top);

                // SL Line (Red)
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.moveTo(0, slY); ctx.lineTo(canvas.width, slY); ctx.stroke();

                // TP Line (Green)
                ctx.strokeStyle = '#22c55e';
                ctx.beginPath(); ctx.moveTo(0, tpY); ctx.lineTo(canvas.width, tpY); ctx.stroke();

                // Entry Line (White/Grey)
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
                ctx.beginPath(); ctx.moveTo(0, entryY); ctx.lineTo(canvas.width, entryY); ctx.stroke();

                // Labels
                ctx.font = 'bold 10px Inter, system-ui';
                ctx.fillStyle = '#ef4444'; ctx.fillText(`STOP LOSS: ${intent.suggestedSL}`, 10, slY - 5);
                ctx.fillStyle = '#22c55e'; ctx.fillText(`TAKE PROFIT: ${intent.suggestedTP}`, 10, tpY - 5);
                ctx.fillStyle = '#ffffff'; ctx.fillText(`ENTRY: ${intent.price}`, 10, entryY - 5);

                // R:R Info
                const risk = Math.abs(intent.price - intent.suggestedSL);
                const reward = Math.abs(intent.suggestedTP - intent.price);
                const rr = (reward / risk).toFixed(2);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(canvas.width / 2 - 40, entryY - 25, 80, 20);
                ctx.fillStyle = '#000000';
                ctx.fillText(`R:R - 1:${rr}`, canvas.width / 2 - 25, entryY - 11);
            }
        };

        const interval = setInterval(render, 100);
        return () => clearInterval(interval);
    }, [intent, chart, series]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none" />;
}

function OpenPositionOverlay({ position, chart, series }: { position: any, chart: IChartApi | null, series: ISeriesApi<'Candlestick', Time> | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !chart || !series) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const entryY = series.priceToCoordinate(position.entryPrice);
            const slY = position.sl ? series.priceToCoordinate(position.sl) : null;
            const tpY = position.tp ? series.priceToCoordinate(position.tp) : null;

            if (entryY !== null) {
                // Entry Line (Dotted)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.moveTo(0, entryY); ctx.lineTo(canvas.width, entryY); ctx.stroke();
                ctx.setLineDash([]);

                // SL Line
                if (slY !== null) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, slY); ctx.lineTo(canvas.width, slY); ctx.stroke();
                    ctx.fillStyle = '#ef4444';
                    ctx.fillText(`SL: ${position.sl} ${position.isBE ? '(BE)' : ''}`, canvas.width - 80, slY - 5);
                }

                // TP Line
                if (tpY !== null) {
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, tpY); ctx.lineTo(canvas.width, tpY); ctx.stroke();
                    ctx.fillStyle = '#22c55e';
                    ctx.fillText(`TP: ${position.tp}`, canvas.width - 80, tpY - 5);
                }
            }
        };

        const interval = setInterval(render, 100);
        return () => clearInterval(interval);
    }, [position, chart, series]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none" />;
}
