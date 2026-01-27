import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { LuMinus, LuCheck, LuX, LuTriangle } from "react-icons/lu";

export function SignalReplay() {
    const { tradeReplays } = useStore();

    if (tradeReplays.length === 0) {
        return (
            <div className="text-center py-12 text-white/20 text-[10px] font-mono">
                No trade replays available yet. Replays are generated after trades close.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {tradeReplays.map((replay, i) => (
                    <motion.div
                        key={replay.tradeId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/5 rounded-2xl border border-white/5 p-4 hover:bg-white/10 transition-all"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {replay.result === 'WIN' && <LuCheck size={20} className="text-green-500" />}
                                {replay.result === 'LOSS' && <LuX size={20} className="text-red-500" />}
                                {replay.result === 'BREAKEVEN' && <LuMinus size={20} className="text-white/40" />}
                                <div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${replay.result === 'WIN' ? 'text-green-400' :
                                        replay.result === 'LOSS' ? 'text-red-400' : 'text-white/40'
                                        }`}>
                                        {replay.result}
                                    </span>
                                    <div className="text-[9px] font-mono text-white/40 mt-0.5">
                                        {new Date(replay.entry).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">Confidence</div>
                                <div className={`text-sm font-black ${replay.confidenceAtEntry >= 80 ? 'text-green-400' :
                                    replay.confidenceAtEntry >= 50 ? 'text-yellow-400' : 'text-white/40'
                                    }`}>
                                    {replay.confidenceAtEntry}%
                                </div>
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="bg-black/40 rounded-xl p-3 mb-3">
                            <p className="text-[11px] font-medium text-white/90 leading-relaxed">
                                {replay.explanation}
                            </p>
                        </div>

                        {/* Market Condition */}
                        <div className="flex items-center gap-2 mb-3">
                            <LuTriangle size={12} className="text-accent" />
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">Market:</span>
                            <span className="text-[9px] font-mono text-white/80">{replay.marketCondition}</span>
                        </div>

                        {/* Strategy Components */}
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(replay.strategyComponents).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1">
                                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-wide">{key}</span>
                                    <span className="text-[9px] font-mono text-white/80">+{value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
