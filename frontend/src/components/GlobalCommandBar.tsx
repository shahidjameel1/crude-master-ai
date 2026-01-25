import { User, ChevronDown, Lock, Menu, X, Play, Pause, AlertOctagon, Bell } from 'lucide-react';
import { useStore, ContractSymbol } from '../store/useStore';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ContractSwitchModal } from './ContractSwitchModal';
import { AgentStatusPill } from './AgentStatusPill';
import { SessionIntelligenceBadge } from './SessionIntelligenceBadge';

export function GlobalCommandBar() {
    const {
        automationMode,
        setAutomationMode,
        setUI,
        globalKillSwitch,
        triggerKillSwitch,
        activeView,
        defaultTrade,
        contracts,
        setContract,
        isDrawerOpen,
        agentState,
        setAgentState,
        notifications,
        isNotificationDrawerOpen,
        isMarketOpen
    } = useStore();

    const heartbeat = useHeartbeat();
    const [isContractMenuOpen, setIsContractMenuOpen] = useState(false);
    const [pendingDefaultSwitch, setPendingDefaultSwitch] = useState<ContractSymbol | null>(null);

    const activeContract = contracts.find(c => c.symbol === activeView) || contracts[0];

    // Auto-Start Logic: If market is open and mode is AUTO, ensure agent is SEARCHING (if previously idle)
    // Note: This is an "Indicator" component logic, actual state transition should be handled with care to avoid loops.
    // For visual feedback:
    const showAutoEngaged = isMarketOpen && automationMode === 'AUTO';

    return (
        <div className="fixed top-0 left-0 right-0 h-10 bg-[#050505] border-b border-white/5 z-[100] flex items-center justify-between px-4 select-none">
            {/* LEFT: Instrument Control */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setUI({ isDrawerOpen: !isDrawerOpen })}
                    className="p-1 hover:bg-white/5 rounded md:hidden"
                >
                    {isDrawerOpen ? <X size={16} className="text-accent" /> : <Menu size={16} className="text-white/60" />}
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hidden md:inline">Instrument</span>
                    <div
                        className="flex items-center gap-2 cursor-pointer group bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                        onClick={() => setIsContractMenuOpen(!isContractMenuOpen)}
                    >
                        <span className="text-[11px] font-black text-white group-hover:text-accent transition-colors tracking-tight">{activeContract.name}</span>
                        <ChevronDown size={12} className="text-white/40 group-hover:text-accent" />
                    </div>
                </div>
            </div>

            {/* RIGHT: Global Command Matrix */}
            <div className="flex items-center gap-4 md:gap-6">

                {/* 1. Agent Status & Latency */}
                <div className="flex items-center gap-3">
                    <AgentStatusPill />

                    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                        <div className={`w-1 h-1 rounded-full bg-current ${heartbeat.status === 'OK' ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
                        <span className={`text-[9px] font-mono font-bold ${heartbeat.status === 'OK' ? 'text-green-500' : 'text-red-500'}`}>{heartbeat.latency}ms</span>
                    </div>

                    {/* Auto-Engage Indicator (Desktop + Mobile Compact) */}
                    {showAutoEngaged ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-tight text-green-500 hidden md:inline">Market Open · Auto Engaged</span>
                            <span className="text-[8px] font-black uppercase tracking-tight text-green-500 md:hidden">AUTO</span>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5 opacity-40">
                            <Lock size={10} />
                            <span className="text-[8px] font-black uppercase tracking-tight">
                                {isMarketOpen ? 'Auto Disabled' : 'Market Closed'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Session Intelligence Badge */}
                <SessionIntelligenceBadge />

                {/* 2. Action Controls */}
                <div className="flex items-center gap-2 border-l border-white/5 pl-4 h-6">
                    {/* Pause/Resume */}
                    <button
                        onClick={() => setAgentState(agentState === 'IDLE' ? 'SEARCHING' : 'IDLE', agentState === 'IDLE' ? 'User Manual Resume' : 'User Manual Pause')}
                        className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded border text-[9px] font-black uppercase tracking-widest transition-all ${agentState === 'IDLE'
                            ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20'
                            }`}
                        title={agentState === 'IDLE' ? "Resume Agent" : "Pause Agent"}
                    >
                        {agentState === 'IDLE' ? <Play size={10} className="fill-current" /> : <Pause size={10} className="fill-current" />}
                        {agentState === 'IDLE' ? 'RESUME' : 'PAUSE'}
                    </button>

                    {/* STOP - The Big Red Button */}
                    <button
                        onDoubleClick={triggerKillSwitch}
                        title="Double Click to KILL NETWORK"
                        disabled={globalKillSwitch}
                        className={`flex items-center gap-2 px-3 py-1 rounded border text-[9px] font-black uppercase tracking-widest transition-all ${globalKillSwitch
                            ? 'bg-red-950 border-red-900 text-red-500 cursor-not-allowed opacity-50'
                            : 'bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            }`}
                    >
                        <AlertOctagon size={12} className={globalKillSwitch ? "" : "fill-white"} />
                        {globalKillSwitch ? 'SYSTEM DEAD' : 'STOP'}
                    </button>
                </div>

                {/* 3. Mode & Profile */}
                <div className="flex items-center gap-3 border-l border-white/5 pl-4 h-6">
                    {/* Mode Switcher - Compact on Mobile */}
                    <div className="flex gap-0.5 p-0.5 bg-white/5 rounded">
                        {['OFF', 'ASSIST', 'AUTO'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setAutomationMode(m as any)}
                                className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${automationMode === m ? 'bg-accent text-white shadow-sm' : 'text-white/20 hover:text-white/40'}`}
                            >
                                {m === 'ASSIST' ? <span className="md:hidden">AST</span> : m}
                                <span className="hidden md:inline">{m === 'ASSIST' ? 'ASSIST' : ''}</span>
                            </button>
                        ))}
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setUI({ isNotificationDrawerOpen: !isNotificationDrawerOpen })}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all relative"
                        >
                            <Bell size={14} className={notifications.length > 0 ? 'text-accent' : ''} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse border border-black" />
                            )}
                        </button>
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setUI({ isAdminPanelOpen: true })}>
                        <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-accent/40 transition-all">
                            <User size={12} className="text-white/40 group-hover:text-accent" />
                        </div>
                    </div>
                </div>
            </div>

            <ContractSwitchModal
                isOpen={!!pendingDefaultSwitch}
                onClose={() => setPendingDefaultSwitch(null)}
                targetContract={pendingDefaultSwitch as any}
                currentContract={defaultTrade}
            />

            {/* Instrument Dropdown Portal */}
            <AnimatePresence>
                {isContractMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-[105]" onClick={() => setIsContractMenuOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            className="absolute top-10 left-4 mt-1 w-60 bg-[#0A0A0A] border border-white/10 rounded-lg p-1 shadow-2xl z-[200]"
                        >
                            {contracts.map((c) => (
                                <div
                                    key={c.symbol}
                                    className={`px-3 py-2 rounded transition-all cursor-pointer flex items-center justify-between ${activeView === c.symbol ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                    onClick={() => {
                                        setContract(c.symbol);
                                        setIsContractMenuOpen(false);
                                    }}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-wide ${activeView === c.symbol ? 'text-white' : 'text-white/60'}`}>
                                        {c.name}
                                    </span>
                                    {activeView === c.symbol && <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(59,130,246)]" />}
                                </div>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
