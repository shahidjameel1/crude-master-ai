import { MarketState, StrategyConfig } from '../hooks/useStrategyEngine';

interface StrategyPanelProps {
    marketState: MarketState;
    config: StrategyConfig;
    onConfigChange: (newConfig: StrategyConfig) => void;
}

export function StrategyPanel({ marketState, config, onConfigChange }: StrategyPanelProps) {
    const {
        price, confluenceScore, isKillZone, riskStatus, activeSignal, signalReason
    } = marketState;

    const toggleStrategy = (key: keyof StrategyConfig) => {
        onConfigChange({
            ...config,
            [key]: !config[key]
        });
    };

    return (
        <div className="absolute top-16 right-4 w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 z-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Strategy Engine</h3>
                <div className={`w-2 h-2 rounded-full ${isKillZone ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            </div>

            {/* Score & Risk */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 p-2 rounded text-center">
                    <div className="text-[10px] text-white/50 uppercase">Confluence</div>
                    <div className={`text-xl font-bold ${confluenceScore > 60 ? 'text-green-400' : 'text-white'}`}>
                        {confluenceScore.toFixed(0)}
                    </div>
                </div>
                <div className="bg-white/5 p-2 rounded text-center">
                    <div className="text-[10px] text-white/50 uppercase">Risk Status</div>
                    <div className={`text-sm font-bold mt-1 ${riskStatus === 'RISKY' ? 'text-red-500' :
                        isKillZone ? 'text-orange-500' : 'text-green-500'
                        }`}>
                        {isKillZone ? 'KILL ZONE' : riskStatus}
                    </div>
                </div>
            </div>

            {/* Active Signal */}
            {activeSignal && (
                <div className={`mb-4 p-3 rounded border ${activeSignal === 'BUY' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className={`font-bold ${activeSignal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {activeSignal} SIGNAL
                        </span>
                        <span className="text-xs text-white/60">@{price.toLocaleString()}</span>
                    </div>
                    {signalReason && (
                        <div className="mt-1 text-[10px] text-white/70 italic">
                            Reason: {signalReason}
                        </div>
                    )}
                </div>
            )}

            {/* Toggles */}
            <div className="space-y-2">
                <div className="text-[10px] text-white/30 uppercase mb-2">Active Modules</div>

                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-text-secondary group-hover:text-white transition-colors">VWAP Bounce</span>
                    <input
                        type="checkbox"
                        checked={config.vwapBounce}
                        onChange={() => toggleStrategy('vwapBounce')}
                        className="form-checkbox h-3 w-3 text-accent rounded bg-white/10 border-white/20"
                    />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-text-secondary group-hover:text-white transition-colors">Trend Following</span>
                    <input
                        type="checkbox"
                        checked={config.trendFollowing}
                        onChange={() => toggleStrategy('trendFollowing')}
                        className="form-checkbox h-3 w-3 text-accent rounded bg-white/10 border-white/20"
                    />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-text-secondary group-hover:text-white transition-colors">Momentum Filter</span>
                    <input
                        type="checkbox"
                        checked={config.momentum}
                        onChange={() => toggleStrategy('momentum')}
                        className="form-checkbox h-3 w-3 text-accent rounded bg-white/10 border-white/20"
                    />
                </label>
            </div>
        </div>
    );
}
