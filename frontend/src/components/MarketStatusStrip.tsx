import { useStore } from '../store/useStore';
import { usePaperTrading } from '../hooks/usePaperTrading';
import { PLDashboard } from './PLDashboard';

export function MarketStatusStrip() {
    const {
        activeTimeframe,
        setUI
    } = useStore();

    const paperTrading = usePaperTrading();
    const timeframes = ['1m', '5m', '15m', '1h', '1d'];

    return (
        <div className="flex-shrink-0 relative z-[90]"> {/* Z-Index below command bar but above chart content */}
            {/* Top Border for separation */}
            {/* <div className="h-px bg-white/5" /> */}

            <div className="flex flex-col md:flex-row items-center border-b border-white/5 bg-[#050505]">
                {/* 1. PL Metrics (Left/Main) */}
                <div className="flex-1 w-full md:w-auto overflow-x-auto no-scrollbar py-2 px-4 md:px-6">
                    <PLDashboard tradeHistory={paperTrading.tradeHistory} />
                </div>

                {/* 2. Timeframe Selector (Right) */}
                <div className="hidden md:flex items-center gap-1 px-4 md:px-6 py-2 border-t md:border-t-0 md:border-l border-white/5 h-full bg-black/40">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mr-2">TF</span>
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setUI({ activeTimeframe: tf })}
                            className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${activeTimeframe === tf
                                ? 'bg-accent text-white shadow-blue-glow'
                                : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Timeframe strip (Separate row on small screens) */}
            <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20 overflow-x-auto">
                {timeframes.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setUI({ activeTimeframe: tf })}
                        className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${activeTimeframe === tf
                            ? 'bg-accent text-white shadow-blue-glow'
                            : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                            }`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        </div>
    );
}
