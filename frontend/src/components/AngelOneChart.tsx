
import { useRef, useEffect, useState } from 'react';
import { contractExpiryStatus } from '../utils/chartUtils';

// Interfaces similar to snippet
interface CandleData {
    time: number; // Unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface ChartProps {
    data: any[]; // Receiving passed down chartData
    height?: number;
    showVolume?: boolean;
    symbol?: string;
}

export function AngelOneChart({ data, height = 400, showVolume = true, symbol = "CRUDEOIL", timeframe = "15m", onTimeframeChange }: ChartProps & { timeframe?: string, onTimeframeChange?: (tf: string) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [candles, setCandles] = useState<CandleData[]>([]);

    // Adapt the passed `data` prop to `CandleData`
    useEffect(() => {
        setCandles(data);
    }, [data]);

    useEffect(() => {
        if (canvasRef.current && candles.length > 0) {
            drawChart(canvasRef.current, candles, showVolume);
        }
    }, [candles, height, showVolume]);

    return (
        <div className="flex flex-col h-full bg-black/40 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-border bg-secondary/50">
                <span className="font-bold text-sm tracking-wider flex items-center gap-2 text-text-primary">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    {symbol}
                    <span className="text-[10px] text-text-tertiary font-mono border border-border px-1 rounded">
                        {contractExpiryStatus(symbol)}
                    </span>
                </span>

                {/* Timeframe Buttons */}
                <div className="flex gap-1 bg-[#1E2433] p-1 rounded-lg border border-border/50">
                    {['1m', '5m', '15m', '60m', '1D'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => onTimeframeChange?.(tf)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${timeframe === tf
                                ? 'bg-accent text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
                                }`}
                        >
                            {tf === '1D' ? '1D' : tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <div className="relative flex-1 w-full h-full">
                <canvas
                    ref={canvasRef}
                    width={800} // This should be dynamic based on container, but fixed for now as per snippet
                    height={height}
                    className="w-full h-full block"
                />
            </div>

            <div className="absolute bottom-2 left-2 text-[10px] text-text-tertiary font-mono pointer-events-none">
                Angel One Data Feed • {candles.length} candles
            </div>
        </div>
    );
}

// Canvas drawing function (Refactored for Professional Look)
function drawChart(
    canvas: HTMLCanvasElement,
    candles: CandleData[],
    showVolume: boolean
) {
    // Dynamic resizing
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height; // Use container height
    const width = canvas.width;

    // Recalculate internal height vars
    const chartHeight = showVolume ? canvas.height * 0.8 : canvas.height;
    const volumeHeight = showVolume ? canvas.height * 0.2 : 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvas.height);

    // Limit candles to fit view (Show last N candles)
    const visibleCandlesCount = Math.floor((width - 60) / 12);
    const visibleCandles = candles.slice(-visibleCandlesCount);

    if (visibleCandles.length === 0) return;

    const highs = visibleCandles.map(c => c.high);
    const lows = visibleCandles.map(c => c.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = (width - 60) / visibleCandles.length;
    const padding = 10;

    // Grid (Horizontal)
    ctx.strokeStyle = '#2D3748'; // --border-color
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]); // Dashed grid
    for (let i = 0; i <= 5; i++) {
        const y = chartHeight - (i * chartHeight / 5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 50, y); // Leave space for axis
        ctx.stroke();

        // Price Label
        const price = minPrice + (priceRange * i) / 5;
        ctx.fillStyle = '#A0AEC0'; // --text-tertiary
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(price.toFixed(0), width - 45, y + 3);
    }
    ctx.setLineDash([]);

    // Draw Candles
    visibleCandles.forEach((candle, index) => {
        const x = padding + index * candleWidth;

        // Normalize prices
        const oY = chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
        const hY = chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
        const lY = chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
        const cY = chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;

        // Color Logic
        const isBullish = candle.close >= candle.open;

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, Math.min(oY, cY), 0, Math.max(oY, cY));
        if (isBullish) {
            gradient.addColorStop(0, '#10B981'); // Emerald
            gradient.addColorStop(1, '#059669'); // Dark Green
            ctx.strokeStyle = '#10B981';
        } else {
            gradient.addColorStop(0, '#F87171'); // Coral
            gradient.addColorStop(1, '#DC2626'); // Crimson
            ctx.strokeStyle = '#EF4444';
        }

        ctx.fillStyle = gradient;
        ctx.lineWidth = 1;

        // Wick
        const wickX = x + candleWidth / 2;
        ctx.beginPath();
        ctx.moveTo(wickX, hY);
        ctx.lineTo(wickX, lY);
        ctx.stroke();

        // Body
        const bodyY = Math.min(oY, cY);
        const bodyH = Math.max(Math.abs(cY - oY), 1); // Min 1px height
        ctx.fillRect(
            x + 1, // spacing
            bodyY,
            candleWidth - 2,
            bodyH
        );
    });

    // Draw Volume
    if (showVolume && volumeHeight > 0) {
        const maxVol = Math.max(...visibleCandles.map(c => c.volume)) || 1;

        visibleCandles.forEach((candle, index) => {
            const x = padding + index * candleWidth;
            const volH = (candle.volume / maxVol) * volumeHeight;
            const volY = canvas.height - volH;

            // Semi-transparent volume bars
            ctx.fillStyle = candle.close >= candle.open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';

            ctx.fillRect(
                x + 1,
                volY,
                candleWidth - 2,
                volH
            );
        });
    }

    // Draw Current Price Line
    const lastCandle = visibleCandles[visibleCandles.length - 1];
    const lastPriceY = chartHeight - ((lastCandle.close - minPrice) / priceRange) * chartHeight;

    ctx.strokeStyle = '#F0F4F8';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, lastPriceY);
    ctx.lineTo(width, lastPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Last Price Label Background
    ctx.fillStyle = lastCandle.close >= lastCandle.open ? '#10B981' : '#EF4444';
    ctx.fillRect(width - 50, lastPriceY - 10, 50, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(lastCandle.close.toFixed(0), width - 45, lastPriceY + 4);
}
