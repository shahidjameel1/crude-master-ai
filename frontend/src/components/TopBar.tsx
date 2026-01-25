import { User, ChevronDown, LogOut, Menu, X, Play, Pause, AlertOctagon, Bell } from 'lucide-react';
import { useStore, ContractSymbol } from '../store/useStore';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ContractSwitchModal } from './ContractSwitchModal';
import { AgentStatusPanel } from './AgentStatusPanel';
import { PLDashboard } from './PLDashboard';
import { usePaperTrading } from '../hooks/usePaperTrading';

export function TopBar() {
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
        setAuthenticated,
        isDrawerOpen,
        activeTimeframe,
        agentState,
        setAgentState,
        notifications,
        isNotificationDrawerOpen
    } = useStore();

    const heartbeat = useHeartbeat();
    const paperTrading = usePaperTrading();
    const [isContractMenuOpen, setIsContractMenuOpen] = useState(false);
    const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
    const [pendingDefaultSwitch, setPendingDefaultSwitch] = useState<ContractSymbol | null>(null);

    const activeContract = contracts.find(c => c.symbol === activeView) || contracts[0];
    const timeframes = ['1m', '5m', '15m', '1h', '1d'];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            setAuthenticated(false);
        } catch (err) {
            console.error('Logout failed', err);
            setAuthenticated(false);
        }
    };

    return (
        <div className="flex-shrink-0 flex flex-col bg-black/80 backdrop-blur-md border-b border-white/5 z-[100]">

            {/* ZONE A: CONTROL STRIP (Top) */}
            <div className="h-10 flex items-center justify-between px-4 md:px-6 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setUI({ isDrawerOpen: !isDrawerOpen })}
                        className="p-1 hover:bg-white/5 rounded md:hidden"
                    >
                        {isDrawerOpen ? <X size={16} className="text-accent" /> : <Menu size={16} className="text-white/60" />}
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Instrument</span>
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsContractMenuOpen(!isContractMenuOpen)}
                        >
                            <span className="text-[10px] font-black text-white group-hover:text-accent transition-colors">{activeContract.name}</span>
                            <ChevronDown size={12} className="text-white/20 group-hover:text-accent" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setUI({ activeTimeframe: tf })}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTimeframe === tf
                                ? 'bg-accent text-white shadow-blue-glow'
                                : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* ZONE B: PERFORMANCE METRICS (Middle, PRIMARY) */}
            <div className="py-2 px-4 md:px-6 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar bg-black/20">
                <PLDashboard tradeHistory={paperTrading.tradeHistory} />
            </div>

            {/* ZONE C: SYSTEM STATUS (Bottom, SECONDARY) */}
            <div className="h-auto md:h-12 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-2 md:py-0 bg-white/[0.01] gap-4 md:gap-0">
                <div className="flex items-center gap-6 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {/* Integrated Agent Status Panel */}
                    <AgentStatusPanel />

                    <div className="h-8 w-px bg-white/5 hidden md:block" />

                    {/* Sys Telemetry & Overrides */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-none">Latency</span>
                            <div className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black tracking-widest ${heartbeat.status === 'OK' ? 'text-success bg-success/10 border-success/20' : 'text-error bg-error/10 border-error/20'
                                }`}>
                                <div className={`w-1 h-1 rounded-full bg-current ${heartbeat.status === 'OK' ? 'animate-pulse' : ''}`} />
                                {heartbeat.latency}ms
                            </div>
                        </div>

                        {/* Direct Safety Controls (No menus) */}
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                            {/* PAUSE / RESUME */}
                            <button
                                onClick={() => setAgentState(agentState === 'IDLE' ? 'SEARCHING' : 'IDLE', agentState === 'IDLE' ? 'User Manual Resume' : 'User Manual Pause')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${agentState === 'IDLE'
                                    ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20'
                                    }`}
                            >
                                {agentState === 'IDLE' ? <Play size={12} /> : <Pause size={12} />}
                                {agentState === 'IDLE' ? 'RESUME' : 'PAUSE'}
                            </button>

                            {/* EMERGENCY STOP (Global Kill) */}
                            <button
                                onDoubleClick={triggerKillSwitch}
                                title="Double Click to KILL"
                                disabled={globalKillSwitch}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${globalKillSwitch
                                    ? 'bg-red-500/20 border-red-500/40 text-red-500 cursor-not-allowed opacity-50'
                                    : 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-red-glow'
                                    }`}
                            >
                                <AlertOctagon size={12} className="fill-white/20" />
                                {globalKillSwitch ? 'SYSTEM DEAD' : 'EMERGENCY STOP'}
                            </button>
                        </div>
                    </div>

                    {/* Profile & Mode Toggle */}
                    <div className="flex items-center gap-6 ml-auto pl-6 border-l border-white/5">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setUI({ isNotificationDrawerOpen: !isNotificationDrawerOpen })}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all relative"
                            >
                                <Bell size={16} className={notifications.length > 0 ? 'text-accent' : ''} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-black" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10">
                            <span className="text-[8px] text-white/20 uppercase font-black">Mode</span>
                            <div className="flex gap-1">
                                {['OFF', 'ASSIST', 'AUTO'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setAutomationMode(m as any)}
                                        className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${automationMode === m ? 'bg-accent text-white shadow-blue-glow' : 'text-white/20 hover:text-white/40'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setUI({ isAdminPanelOpen: true })}>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-white/80 group-hover:text-white leading-none">Operator #04</span>
                                <span className="text-[7px] text-accent font-black uppercase tracking-widest mt-0.5">ADMIN</span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-accent/40 transition-all">
                                <User size={16} className="text-white/40 group-hover:text-accent" />
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/20 hover:text-error hover:bg-error/10 transition-all"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                <ContractSwitchModal
                    isOpen={!!pendingDefaultSwitch}
                    onClose={() => setPendingDefaultSwitch(null)}
                    targetContract={pendingDefaultSwitch as any}
                    currentContract={defaultTrade}
                />

                {/* Contract Selection Dropdown (Mini) */}
                <AnimatePresence>
                    {isContractMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[110]" onClick={() => setIsContractMenuOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-10 left-4 mt-2 w-64 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[200]"
                            >
                                <div className="px-3 py-2 border-b border-white/5 mb-1">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Select Instrument</span>
                                </div>
                                <div className="space-y-1">
                                    {contracts.map((c) => (
                                        <div
                                            key={c.symbol}
                                            className={`p-3 rounded-xl transition-all cursor-pointer ${activeView === c.symbol ? 'bg-white/5' : 'hover:bg-white/5'}`}
                                            onClick={() => {
                                                setContract(c.symbol);
                                                setIsContractMenuOpen(false);
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeView === c.symbol ? 'text-accent' : 'text-white/60'}`}>
                                                    {c.name}
                                                </span>
                                                <span className="text-[8px] text-white/20">{c.exchange} • {c.multiplier}x Multiplier</span>
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
    );
}
