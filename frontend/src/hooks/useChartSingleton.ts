import { createChart, IChartApi } from 'lightweight-charts';

let chartSingleton: IChartApi | null = null;

export function getChart(container: HTMLDivElement) {
    if (chartSingleton) {
        // Re-parent the chart if needed (though not strictly necessary with the 'NEVER UNMOUNT' rule)
        return chartSingleton;
    }

    chartSingleton = createChart(container, {
        layout: {
            background: { color: '#05070c' },
            textColor: '#cfd3dc',
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        crosshair: { mode: 1 },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            autoScale: true
        },
    });

    return chartSingleton;
}

export function resetChart() {
    if (chartSingleton) {
        chartSingleton.remove();
        chartSingleton = null;
    }
}
