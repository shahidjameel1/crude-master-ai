import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

interface LiveCandleIndicatorProps {
    isLive: boolean;
    chart: IChartApi | null;
    series: ISeriesApi<'Candlestick'> | null;
}

export function LiveCandleIndicator({ isLive, chart, series }: LiveCandleIndicatorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !chart || !series || !isLive) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Get the last visible candle position
            const visibleRange = chart.timeScale().getVisibleLogicalRange();
            if (!visibleRange) return;

            const lastTime = chart.timeScale().coordinateToTime(canvas.width - 50);
            if (!lastTime) return;

            // Draw "FORMING" indicator
            ctx.font = 'bold 10px Inter, system-ui';
            ctx.fillStyle = '#fbbf24'; // amber color
            ctx.fillText('FORMING', canvas.width - 80, 20);

            // Draw pulsing dot
            const pulseOpacity = (Math.sin(Date.now() / 500) + 1) / 2;
            ctx.fillStyle = `rgba(251, 191, 36, ${pulseOpacity})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 90, 15, 4, 0, Math.PI * 2);
            ctx.fill();
        };

        const interval = setInterval(render, 50);
        return () => clearInterval(interval);
    }, [isLive, chart, series]);

    if (!isLive) return null;
    return <canvas ref={canvasRef} className="absolute inset-0 z-50 pointer-events-none" />;
}

// USAGE IN CHART COMPONENT:
// Add this after the chart container div:
// <LiveCandleIndicator isLive={liveCandle !== null} chart={chartRef.current} series={candleSeriesRef.current} />
