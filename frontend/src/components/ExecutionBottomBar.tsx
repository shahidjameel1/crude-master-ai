import { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, ScrollText, History, Zap, Bell, CheckCircle2 } from 'lucide-react';

export function ExecutionBottomBar() {
    const {
        currentPrice,
        systemLogs,
        confluenceScore,
        globalKillSwitch,
        requestTrade,
        isCovertMode
    } = useStore();

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [systemLogs]);

    return (
        <div className="h-24 flex-shrink-0 flex items-center bg-black/80 backdrop-blur-xl border-t border-white/5 px-6 gap-6 z-[100]">

            {/* Execution Panel */}
            <div className="flex items-center gap-3 pr-6 border-r border-white/5">
                <div className="flex flex-col gap-1 min-w-[120px]">
                    <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">{isCovertMode ? 'REF' : 'Entry Protocol'}</span>
                    <div className="text-sm font-black text-white">{isCovertMode ? `MKT ${currentPrice.toFixed(0)}` : `₹${currentPrice.toLocaleString('en-IN')}`}</div>
                </div>

                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={globalKillSwitch}
                        className={`flex items-center gap-2 px-4 h-12 rounded-xl font-black uppercase text-xs transition-all ${globalKillSwitch
                            ? 'bg-white/5 text-white/10 cursor-not-allowed'
                            : 'bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 shadow-green-glow'
                            }`}
                        onClick={() => requestTrade('BUY')}
                    >
                        <ArrowUpCircle size={18} />
                        {isCovertMode ? '▲' : 'Buy Market'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={globalKillSwitch}
                        className={`flex items-center gap-2 px-4 h-12 rounded-xl font-black uppercase text-xs transition-all ${globalKillSwitch
                            ? 'bg-white/5 text-white/10 cursor-not-allowed'
                            : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 shadow-red-glow'
                            }`}
                        onClick={() => requestTrade('SELL')}
                    >
                        <ArrowDownCircle size={18} />
                        {isCovertMode ? '▼' : 'Sell Market'}
                    </motion.button>
                </div>
            </div>

            {/* Live Activity Log */}
            <div className="flex-1 h-full py-3 flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                    <ScrollText size={12} className="text-accent" />
                    <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">System Activity Log</span>
                </div>
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-2"
                >
                    <AnimatePresence mode="popLayout">
                        {systemLogs.length === 0 ? (
                            <span className="text-[10px] text-white/10 font-mono italic">Waiting for system telemetry...</span>
                        ) : (
                            systemLogs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 group"
                                >
                                    <span className="text-[8px] font-mono text-white/10 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <span className={`text-[10px] font-mono truncate transition-colors ${log.includes('KILL SWITCH') ? 'text-red-500 font-bold' :
                                        log.includes('EXECUTION') ? 'text-green-400' :
                                            log.includes('CONFLUENCE') ? 'text-accent' : 'text-white/40'
                                        }`}>
                                        {log}
                                    </span>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Quick Status / Review */}
            <div className="flex items-center gap-6 pl-6 border-l border-white/5">
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <Zap size={14} className={confluenceScore >= 80 ? 'text-accent animate-pulse' : 'text-white/20'} />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isCovertMode ? 'GATING' : 'Logic Status'}</span>
                    </div>
                    <div className={`text-[10px] font-bold uppercase transition-colors ${confluenceScore >= 80 ? 'text-accent' : 'text-white/20'}`}>
                        {confluenceScore >= 80 ? (isCovertMode ? 'A-GRADE' : 'HIGH QUALITY') : 'NOISE GATING'}
                    </div>
                </div>

                <div className="flex flex-col items-end group cursor-pointer">
                    <div className="flex items-center gap-2">
                        <History size={14} className="text-white/20 group-hover:text-accent transition-colors" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">{isCovertMode ? 'LAST' : 'Last Trade'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <CheckCircle2 size={12} className="text-green-500/60" />
                        <span className="text-[10px] font-bold text-white/80">{isCovertMode ? 'Δ +2.4' : '+₹2,450 (A)'}</span>
                    </div>
                </div>

                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-accent/40 transition-all cursor-pointer">
                        <Bell size={18} className="text-white/40" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-black animate-pulse" />
                </div>
            </div>
        </div>
    );
}
