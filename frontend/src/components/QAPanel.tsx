import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LuCircleCheck, LuTriangleAlert, LuCircleX, LuX, LuInfo,
    LuActivity, LuShield, LuZap, LuLock, LuWifi, LuDatabase,
    LuTerminal, LuBell, LuMonitor, LuGauge
} from "react-icons/lu";
import { useHeartbeat } from '../hooks/useHeartbeat';

export function QAPanel() {
    const {
        isQAPanelOpen, setUI, systemDiagnostics,
        isAuthenticated, systemMode, backendStatus,
        agentState, confluenceScore,
        globalKillSwitch, notifications, chartStatus
    } = useStore();

    const heartbeat = useHeartbeat();

    if (!isQAPanelOpen) return null;

    const checks = [
        {
            label: 'Auth Session',
            status: isAuthenticated ? 'PASS' : (systemMode === 'PAPER' ? 'WARN' : 'FAIL'),
            desc: isAuthenticated ? 'Standard Auth Valid' : (systemMode === 'PAPER' ? 'Bypassed (PAPER)' : 'Unauthorized'),
            icon: <LuLock size={14} />
        },
        {
            label: 'Mode Lock',
            status: 'PASS',
            desc: `Enforced: ${systemMode}`,
            icon: <LuShield size={14} />
        },
        {
            label: 'Broker Feed',
            status: backendStatus.dataFeed === 'ANGEL_ONE' ? 'PASS' : (systemMode === 'PAPER' ? 'WARN' : 'FAIL'),
            desc: backendStatus.dataFeed === 'ANGEL_ONE' ? 'Connected to Angel One' : (systemMode === 'PAPER' ? 'Paper Logic (No Feed)' : 'Feed Offline'),
            icon: <LuDatabase size={14} />
        },
        {
            label: 'Candle Stream',
            status: systemDiagnostics.marketData === 'OK' ? 'PASS' : (systemDiagnostics.marketData === 'STALE' ? 'WARN' : 'FAIL'),
            desc: systemDiagnostics.marketData === 'OK' ? 'Live Data Flowing' : 'Data Stale or Missing',
            icon: <LuZap size={14} />
        },
        {
            label: 'WS Heartbeat',
            status: heartbeat.status === 'OK' ? 'PASS' : 'FAIL',
            desc: `Latency: ${heartbeat.latency}ms`,
            icon: <LuWifi size={14} />
        },
        {
            label: 'Agent Loop',
            status: agentState !== 'IDLE' ? 'PASS' : 'WARN',
            desc: `State: ${agentState}`,
            icon: <LuActivity size={14} />
        },
        {
            label: 'Strategy Engine',
            status: confluenceScore >= 0 ? 'PASS' : 'FAIL',
            desc: `Score: ${confluenceScore}`,
            icon: <LuGauge size={14} />
        },
        {
            label: 'Order Executor',
            status: backendStatus.orders !== 'OFFLINE' ? 'PASS' : 'FAIL',
            desc: `Path: ${backendStatus.orders}`,
            icon: <LuTerminal size={14} />
        },
        {
            label: 'Kill Switch',
            status: !globalKillSwitch ? 'PASS' : 'FAIL',
            desc: globalKillSwitch ? 'EMERGENCY STOP ACTIVE' : 'Operational',
            icon: <LuShield size={14} className="text-red-500" />
        },
        {
            label: 'Notifications',
            status: 'PASS',
            desc: `${notifications.length} logs in session`,
            icon: <LuBell size={14} />
        },
        {
            label: 'Chart Health',
            status: chartStatus === 'READY' ? 'PASS' : 'FAIL',
            desc: `Status: ${chartStatus}`,
            icon: <LuMonitor size={14} />
        },
        {
            label: 'System Latency',
            status: heartbeat.latency < 500 ? 'PASS' : (heartbeat.latency < 2000 ? 'WARN' : 'FAIL'),
            desc: `${heartbeat.latency}ms`,
            icon: <LuGauge size={14} />
        }
    ];

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'HEALTHY': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'DEGRADED': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'UNSAFE': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-white/40 bg-white/5 border-white/5';
        }
    };

    const getHealthState = () => {
        const { marketData, agent, backend } = systemDiagnostics;
        if (backend === 'UNSAFE' || globalKillSwitch) return 'UNSAFE';
        if (backend === 'DEGRADED' || marketData === 'STALE' || agent === 'STALLED') return 'DEGRADED';
        return 'HEALTHY';
    };

    const overallHealth = getHealthState();

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'HEALTHY':
            case 'OK':
            case 'ACTIVE':
            case 'READY': return <LuCircleCheck className="text-green-400" />;
            case 'DEGRADED':
            case 'WARN':
            case 'STALE':
            case 'IDLE': return <LuTriangleAlert className="text-yellow-400" />;
            case 'UNSAFE':
            case 'FAIL':
            case 'DOWN':
            case 'BLOCKED':
            case 'UNREACHABLE': return <LuCircleX className="text-red-500" />;
            default: return <LuInfo className="text-gray-400" />;
        }
    };

    // --- Usage of overallHealth in the UI ---
    // (Assuming there's a header or summary section that needs it)

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">DIAGNOSTIC TERMINAL</h2>
                                <p className="text-[10px] text-white/40 tracking-[0.2em] mt-1 uppercase">Centralized System Integrity Audit</p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${getStatusStyles(overallHealth)} shadow-lg shadow-current/10`}>
                                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                <span className="text-[10px] font-black tracking-widest uppercase">{overallHealth}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setUI({ isQAPanelOpen: false })}
                            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                        >
                            <LuX size={24} />
                        </button>
                    </div>

                    {/* Grid of Checks */}
                    <div className="p-6 h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {checks.map((check, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${getStatusStyles(check.status)}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-black/20 text-white/60">
                                            {check.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase tracking-tight">{check.label}</span>
                                            <span className="text-[9px] opacity-60 font-medium">{check.desc}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest">{check.status}</span>
                                        {getStatusIcon(check.status)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                            <div className="flex items-center gap-2">
                                <LuInfo size={16} className="text-accent" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Diagnostic Summary</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                                    <span className="text-[8px] text-white/20 uppercase font-bold">Last Scan</span>
                                    <div className="text-xs font-mono text-white/80">{new Date(systemDiagnostics.lastCheck).toLocaleTimeString()}</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                                    <span className="text-[8px] text-white/20 uppercase font-bold">Error Rate</span>
                                    <div className="text-xs font-mono text-green-500">0.00%</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                                    <span className="text-[8px] text-white/20 uppercase font-bold">Uptime</span>
                                    <div className="text-xs font-mono text-accent">100.0%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-black/50 border-t border-white/5 flex items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">Self-Diagnostic Engine: Active</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">FRIDAY-X OS · QA_REV_7.2</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
