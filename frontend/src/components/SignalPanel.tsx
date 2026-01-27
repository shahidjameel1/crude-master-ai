import { LuZap, LuArrowUp, LuArrowDown } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';

export interface Signal {
    id: string;
    type: 'LONG' | 'SHORT';
    price: number;
    time: string;
    confidence: number;
    strategy: string;
    tp: number;
    sl: number;
    status: 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'STOPPED' | 'PROFIT';
    pnl?: number;
}

interface SignalPanelProps {
    signals: Signal[];
}

export function SignalPanel({ signals = [] }: SignalPanelProps) {
    return (
        <div className="flex-1 flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="p-4 border-b border-border bg-black/40 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <LuZap size={16} className="text-cyan animate-pulse shadow-cyan-glow" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white font-heading">Active Signals</span>
                </div>
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-success shadow-success-glow"
                    />
                    <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Engine</span>
                </div>
            </div>

            {/* Signal List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {signals.map((signal, index) => (
                        <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9, rotateY: 20 }}
                            animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, x: -20, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className={`
                                relative p-4 rounded-xl border border-white/10 group cursor-pointer overflow-hidden
                                ${signal.type === 'LONG'
                                    ? 'bg-gradient-to-br from-success/5 to-transparent border-l-2 border-l-success'
                                    : 'bg-gradient-to-br from-error/5 to-transparent border-l-2 border-l-error'}
                            `}
                        >
                            {/* Animated Background Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${signal.type === 'LONG' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                        {signal.type === 'LONG' ? <LuArrowUp size={20} fill="currentColor" /> : <LuArrowDown size={20} fill="currentColor" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-sm ${signal.type === 'LONG' ? 'text-success' : 'text-error'}`}>
                                            {signal.type} ORDER
                                        </div>
                                        <div className="text-lg font-bold text-white font-mono">@ {signal.price}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-text-tertiary font-mono bg-black/40 px-2 py-1 rounded border border-white/5">
                                    {signal.time}
                                </div>
                            </div>

                            {/* Targets Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-2 bg-black/40 rounded border border-white/5">
                                    <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Take Profit</div>
                                    <div className="text-sm font-bold text-success font-mono">{signal.tp}</div>
                                </div>
                                <div className="p-2 bg-black/40 rounded border border-white/5">
                                    <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Stop Loss</div>
                                    <div className="text-sm font-bold text-error font-mono">{signal.sl}</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan"></div>
                                    <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-tighter">{signal.strategy}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-12 bg-black/40 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${signal.confidence}%` }}
                                            className={`h-full ${signal.confidence > 80 ? 'bg-success' : 'bg-warning'}`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-white font-mono">{signal.confidence}%</span>
                                </div>
                            </div>

                            {/* Hover Action Overlay */}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-2 bg-accent text-white font-bold text-xs rounded-full shadow-blue-glow border border-accent/50"
                                >
                                    CONFIRM EXECUTION
                                </motion.button>
                                <button className="text-[10px] text-text-tertiary font-bold hover:text-white transition-colors uppercase tracking-widest">
                                    View Logic Analysis
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {signals.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 group">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <LuZap size={40} className="text-text-tertiary mb-4" />
                        </motion.div>
                        <div className="text-center text-text-tertiary font-bold text-[10px] uppercase tracking-widest">
                            Scanning market for ICT/SMC patterns...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
