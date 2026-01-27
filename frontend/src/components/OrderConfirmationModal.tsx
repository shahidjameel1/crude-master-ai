import { motion, AnimatePresence } from 'framer-motion';
import { LuShieldCheck, LuX, LuTrendingUp, LuTrendingDown, LuShieldAlert } from "react-icons/lu";
import { useStore } from '../store/useStore';
import { HoldToConfirm } from './HoldToConfirm';

export function OrderConfirmationModal() {
    const { pendingTrade, confirmTrade, cancelTrade, deviceType } = useStore();

    if (!pendingTrade) return null;

    const isBuy = pendingTrade.side === 'BUY';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={cancelTrade}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-[#0A0D14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className={`p-6 border-b border-white/5 flex items-center justify-between ${isBuy ? 'bg-success/10' : 'bg-red-500/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuy ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                                {isBuy ? <LuTrendingUp size={20} /> : <LuTrendingDown size={20} />}
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Confirm {pendingTrade.side}</h3>
                                <p className="text-[10px] text-white/40 font-mono">INTENT ID: {pendingTrade.timestamp.toString().slice(-8)}</p>
                            </div>
                        </div>
                        <button onClick={cancelTrade} className="text-white/20 hover:text-white transition-colors">
                            <LuX size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col gap-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Entry Price</span>
                                <span className="text-lg font-mono font-bold text-white tracking-tighter">₹{pendingTrade.price.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Risk Amount</span>
                                <span className="text-lg font-mono font-bold text-red-500 tracking-tighter">₹{pendingTrade.riskAmount}</span>
                            </div>
                        </div>

                        {/* Projection Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-red-500">Stop Loss</span>
                                <span className="text-success">Target (TP)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full relative overflow-hidden">
                                <div className="absolute inset-0 flex">
                                    <div className="flex-1 bg-red-400/20 border-r border-red-500/30" />
                                    <div className="flex-[2] bg-success/20 border-l border-success/30" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between font-mono text-xs text-white/60">
                                <span>₹{pendingTrade.suggestedSL.toFixed(2)}</span>
                                <span className="text-accent font-bold">1:2.0 R:R</span>
                                <span>₹{pendingTrade.suggestedTP.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Confluence Check */}
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LuShieldCheck size={14} className="text-accent" />
                                <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Confluence Score</span>
                            </div>
                            <span className="text-xs font-black text-accent">{pendingTrade.confluenceSnapshot}/100</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            <LuShieldAlert size={12} className="text-yellow-500" />
                            <span>Institutional Integrity Check Passed</span>
                        </div>

                        {deviceType === 'MOBILE' ? (
                            <HoldToConfirm
                                onConfirm={confirmTrade}
                                text={`COMMIT ${pendingTrade.side}`}
                                color={isBuy ? 'bg-success' : 'bg-red-500'}
                            />
                        ) : (
                            <button
                                onClick={confirmTrade}
                                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 ${isBuy
                                    ? 'bg-success text-white shadow-green-glow'
                                    : 'bg-red-500 text-white shadow-red-glow'
                                    }`}
                            >
                                Commit Execution
                            </button>
                        )}

                        <button
                            onClick={cancelTrade}
                            className="w-full py-3 text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Discard Fragment
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
