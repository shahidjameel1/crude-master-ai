import { Power, User, ChevronDown, Lock, ShieldCheck } from 'lucide-react';
import { useStore, ContractSymbol } from '../store/useStore';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ContractSwitchModal } from './ContractSwitchModal';

export function TopBar() {
    const {
        confluenceScore,
        automationMode,
        setAutomationMode,
        isInsightDrawerOpen,
        setUI,
        globalKillSwitch,
        triggerKillSwitch,
        activeView,
        defaultTrade,
        contracts,
        setContract,
        agentMode,
        opportunityScore,
        isCovertMode
    } = useStore();

    const heartbeat = useHeartbeat();
    const [isContractMenuOpen, setIsContractMenuOpen] = useState(false);
    const [pendingDefaultSwitch, setPendingDefaultSwitch] = useState<ContractSymbol | null>(null);

    const activeContract = contracts.find(c => c.symbol === activeView) || contracts[0];

    const getAgentModeColor = (mode: string) => {
        switch (mode) {
            case 'STRIKE': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'PREPARE': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'SEARCH': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'DEFENSIVE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'LOCKDOWN': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            default: return 'text-white/40 bg-white/5 border-white/10';
        }
    };

    const getAgentModeGlyph = (mode: string) => {
        switch (mode) {
            case 'STRIKE': return '◉';
            case 'PREPARE': return '⬢';
            case 'SEARCH': return '⬡';
            case 'DEFENSIVE': return '▣';
            case 'LOCKDOWN': return '✖';
            default: return '◎';
        }
    };

    return (
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md border-b border-white/5 z-[100]">

            {/* Left: Instrument & Global Status */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 relative">
                    <div className="flex flex-col">
                        <div
                            className="flex items-center gap-2 group cursor-pointer"
                            onClick={() => setIsContractMenuOpen(!isContractMenuOpen)}
                        >
                            <h1 className="text-sm font-black text-white tracking-widest uppercase font-heading group-hover:text-accent transition-colors">
                                {activeContract.name}
                            </h1>
                            <ChevronDown size={14} className={`text-white/20 group-hover:text-accent transition-transform duration-300 ${isContractMenuOpen ? 'rotate-180' : ''}`} />
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                            {activeView === defaultTrade ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={8} /> AUTO ENABLED
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        VIEW ONLY
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contract Selection Dropdown */}
                    <AnimatePresence>
                        {isContractMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[-1]" onClick={() => setIsContractMenuOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[110]"
                                >
                                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Select Instrument</span>
                                    </div>
                                    <div className="space-y-1">
                                        {contracts.map((c) => (
                                            <div
                                                key={c.symbol}
                                                className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${activeView === c.symbol ? 'bg-white/5' : 'hover:bg-white/5'}`}
                                                onClick={() => {
                                                    setContract(c.symbol);
                                                    setIsContractMenuOpen(false);
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeView === c.symbol ? 'text-accent' : 'text-white/60 group-hover:text-white'}`}>
                                                        {c.name}
                                                    </span>
                                                    <span className="text-[8px] text-white/20 font-bold">{c.exchange} • Mult: {c.multiplier}x</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {c.symbol === defaultTrade && (
                                                        <div className="p-1 rounded-md bg-green-500/10 text-green-500" title="Default Trading Contract">
                                                            <Lock size={12} />
                                                        </div>
                                                    )}
                                                    {c.symbol !== defaultTrade && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPendingDefaultSwitch(c.symbol);
                                                                setIsContractMenuOpen(false);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white/5 text-white/40 hover:bg-accent hover:text-white transition-all"
                                                            title="Set as Default Trading Contract"
                                                        >
                                                            <ShieldCheck size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            <div className="h-8 w-px bg-white/5" />

            {/* Heartbeat Status */}
            <div className="flex flex-col">
                <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">SYS</span>
                <div className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black tracking-widest ${heartbeat.status === 'OK' ? 'text-success bg-success/10 border-success/20' :
                        heartbeat.status === 'DEGRADED' ? 'text-warning bg-warning/10 border-warning/20' :
                            'text-error bg-error/10 border-error/20'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${heartbeat.status === 'OK' ? 'animate-pulse' : ''}`} />
                    {heartbeat.status === 'OK' ? `${heartbeat.latency}ms` : heartbeat.status}
                </div>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">{isCovertMode ? 'STS' : 'Agent State'}</span>
                    <div className={`mt-1 px-3 py-1 rounded-lg border text-[10px] font-black tracking-[0.1em] transition-all flex items-center gap-2 ${getAgentModeColor(agentMode)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${agentMode === 'STRIKE' ? 'animate-ping' : ''}`} />
                        {isCovertMode ? getAgentModeGlyph(agentMode) : agentMode}
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">{isCovertMode ? 'VAL' : 'Opp Score'}</span>
                    <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-xs font-black font-mono ${opportunityScore >= 75 ? 'text-accent shadow-blue-glow' : 'text-white/40'}`}>
                            {isCovertMode ? `Δ ${opportunityScore}` : opportunityScore}
                        </span>
                        <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${opportunityScore}%` }}
                                className={`h-full ${opportunityScore >= 75 ? 'bg-accent' : 'bg-white/20'}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/5" />

                <div className="flex flex-col">
                    <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">{isCovertMode ? 'ENG' : 'Auto Engagement'}</span>
                    <div className="flex gap-2 mt-1">
                        {['OFF', 'ASSIST', 'AUTO'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setAutomationMode(mode as any)}
                                className={`px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest transition-all border ${automationMode === mode
                                    ? mode === 'AUTO'
                                        ? 'bg-red-500 text-white border-red-500 shadow-red-glow animate-pulse'
                                        : 'bg-accent text-white border-accent shadow-blue-glow'
                                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white/60'
                                    }`}
                            >
                                {isCovertMode ? (
                                    mode === 'OFF' ? '○' : mode === 'ASSIST' ? '△' : '▲'
                                ) : mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

            {/* Center: Confluence Score Ring */ }
    <div className="flex flex-col items-center">
        <ConfluenceRing
            score={confluenceScore}
            onClick={() => setUI({ isInsightDrawerOpen: !isInsightDrawerOpen })}
            isActive={isInsightDrawerOpen}
            isCovert={isCovertMode}
        />
        <span className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em] mt-1">{isCovertMode ? 'LAW' : 'Confluence Law'}</span>
    </div>

    {/* Right: Panic Kill Switch & Profile */ }
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] text-white/20 uppercase font-black tracking-widest mb-1">Safety Override</span>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerKillSwitch}
                        disabled={globalKillSwitch}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${globalKillSwitch
                            ? 'bg-red-500/10 border-red-500/20 text-red-500/40 cursor-not-allowed'
                            : 'bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30 shadow-red-glow'
                            }`}
                    >
                        <Power size={16} className={globalKillSwitch ? '' : 'animate-pulse'} />
                        <span className="text-xs font-black uppercase tracking-tighter">Global Kill Switch</span>
                    </motion.button>
                </div>

                <div className="h-10 w-px bg-white/5" />

                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setUI({ isAdminPanelOpen: true })}>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">Admin Operator</span>
                        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Prop Rank #04</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-indigo-500/10 border border-white/10 flex items-center justify-center group-hover:border-accent/40 transition-all">
                        <User size={20} className="text-white/40 group-hover:text-accent transition-colors" />
                    </div>
                </div>
            </div>

            <ContractSwitchModal
                isOpen={!!pendingDefaultSwitch}
                onClose={() => setPendingDefaultSwitch(null)}
                targetContract={pendingDefaultSwitch as any}
                currentContract={defaultTrade}
            />
        </div >
    );
}

function ConfluenceRing({ score, onClick, isActive, isCovert }: { score: number, onClick: () => void, isActive: boolean, isCovert?: boolean }) {
    const size = 60;
    const strokeWidth = 5;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return '#00FF88'; // Green
        if (s >= 60) return '#FFBB00'; // Yellow/Gold
        return '#FF0055'; // Red
    };

    return (
        <div
            onClick={onClick}
            className={`relative flex items-center justify-center transform group cursor-pointer hover:scale-110 transition-all duration-500 ${isActive ? 'rotate-[360deg]' : ''}`}
        >
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                    cx={center} cy={center} r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                />
                {/* Animated Score Ring */}
                <motion.circle
                    cx={center} cy={center} r={radius}
                    fill="transparent"
                    stroke={getColor(score)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: offset, stroke: getColor(score) }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    key={score}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-lg font-black text-white leading-none"
                >
                    {isCovert ? 'Δ' : score}
                </motion.span>
                <div className="w-1 h-1 rounded-full bg-accent animate-pulse mt-0.5" />
            </div>
        </div>
    );
}
