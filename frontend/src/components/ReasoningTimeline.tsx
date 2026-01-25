import { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, Pause, Search, RefreshCw, Zap, ShieldAlert, Circle } from 'lucide-react';

export function ReasoningTimeline() {
    const { agentReasoning, agentState } = useStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top of list as new logs come in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [agentReasoning]);

    const getIcon = (state: string) => {
        switch (state) {
            case 'SEARCHING': return <Search size={14} className="text-cyan-400" />;
            case 'ANALYZING': return <RefreshCw size={14} className="text-yellow-400" />;
            case 'EXECUTING': return <Zap size={14} className="text-red-500" />;
            case 'PAUSED': return <Pause size={14} className="text-white/40" />;
            case 'ERROR': return <ShieldAlert size={14} className="text-red-600" />;
            default: return <Circle size={14} className="text-gray-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
                <GitCommit size={14} className="text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Agent Reasoning</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 relative"
            >
                {/* Visual Connector Line */}
                <div className="absolute top-4 bottom-4 left-[19px] w-px bg-white/5 z-0" />

                <AnimatePresence initial={false}>
                    {agentReasoning.length === 0 ? (
                        <div className="text-center py-8 text-white/20 text-[10px] font-mono">
                            Awaiting agent decision stream...
                        </div>
                    ) : (
                        agentReasoning.map((log, i) => (
                            <motion.div
                                key={`${log.timestamp}-${i}`}
                                initial={{ opacity: 0, x: -10, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                className="relative z-10 flex gap-3"
                            >
                                <div className="shrink-0 mt-0.5 bg-black rounded-full border border-white/10 p-1 bg-[#0A0A0A]">
                                    {getIcon(log.state)}
                                </div>
                                <div className="flex-1 min-w-0 pb-2">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${log.state === 'EXECUTING' ? 'text-red-400' :
                                                log.state === 'ANALYZING' ? 'text-yellow-400' :
                                                    'text-white/60'
                                            }`}>
                                            {log.state}
                                        </span>
                                        <span className="text-[8px] font-mono text-white/20">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-white/90 leading-relaxed break-words">
                                        {log.reason}
                                    </p>
                                    {log.details && (
                                        <p className="mt-1 text-[9px] font-mono text-white/40 bg-white/5 p-1.5 rounded border border-white/5 break-words">
                                            {log.details}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
