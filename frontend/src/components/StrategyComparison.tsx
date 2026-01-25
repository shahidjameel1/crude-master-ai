import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

export function StrategyComparison() {
    const { strategyProfiles, activeStrategyId, setActiveStrategy } = useStore();

    // Determine which strategy is preferred for current conditions
    const preferredStrategy = strategyProfiles.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
    );

    return (
        <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4">
                <Target size={14} className="text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Strategy Comparison</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {strategyProfiles.map((strategy) => {
                    const isActive = strategy.id === activeStrategyId;
                    const isPreferred = strategy.id === preferredStrategy.id;

                    return (
                        <motion.div
                            key={strategy.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveStrategy(strategy.id)}
                            className={`relative p-3 rounded-xl border cursor-pointer transition-all ${isActive
                                    ? 'bg-accent/10 border-accent/40 shadow-blue-glow'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {/* Preferred Badge */}
                            {isPreferred && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center border-2 border-black">
                                    <Award size={10} className="text-white" />
                                </div>
                            )}

                            {/* Strategy Name */}
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-wide ${isActive ? 'text-accent' : 'text-white/60'
                                    }`}>
                                    {strategy.name}
                                </span>
                                {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                )}
                            </div>

                            {/* Confidence */}
                            <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] font-bold text-white/40 uppercase">Confidence</span>
                                    <span className={`text-xs font-black ${strategy.confidence >= 80 ? 'text-green-400' :
                                            strategy.confidence >= 50 ? 'text-yellow-400' : 'text-white/40'
                                        }`}>
                                        {strategy.confidence}%
                                    </span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${strategy.confidence}%` }}
                                        className={`h-full rounded-full ${strategy.confidence >= 80 ? 'bg-green-500' :
                                                strategy.confidence >= 50 ? 'bg-yellow-500' : 'bg-white/20'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                    <div className="text-white/40 uppercase font-bold">Win Rate</div>
                                    <div className="text-white/80 font-mono">{strategy.winRate}%</div>
                                </div>
                                <div>
                                    <div className="text-white/40 uppercase font-bold">Drawdown</div>
                                    <div className="text-red-400 font-mono">{strategy.drawdown}%</div>
                                </div>
                            </div>

                            {/* Market Suitability */}
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <div className="text-[7px] text-white/40 uppercase font-bold mb-0.5">Best For</div>
                                <div className="text-[9px] text-white/80 font-medium">{strategy.marketSuitability}</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Preference Explanation */}
            {preferredStrategy && (
                <div className="mt-3 p-2 bg-black/40 rounded-lg">
                    <div className="flex items-start gap-2">
                        <TrendingUp size={12} className="text-accent mt-0.5" />
                        <p className="text-[9px] font-medium text-white/80 leading-relaxed">
                            <span className="font-black text-accent">{preferredStrategy.name}</span> is currently preferred due to higher confidence in {preferredStrategy.marketSuitability.toLowerCase()} conditions.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
