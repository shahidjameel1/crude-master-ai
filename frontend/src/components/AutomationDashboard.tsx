import { useState, useEffect } from 'react';
import { Shield, Lock, Play, Square, History } from 'lucide-react';
import { AutomationMode } from '../hooks/useAutomationEngine';
import { getAuditLogs, AuditEntry } from '../logic/AuditLogStore';

interface AutomationDashboardProps {
    mode: AutomationMode;
    onModeChange: (mode: AutomationMode) => void;
    prerequisites: {
        tradeCountPassed: boolean;
        expectancyPassed: boolean;
        disciplinePassed: boolean;
        isUnlocked: boolean;
    };
    onKillSwitch: () => void;
}

export function AutomationDashboard({ mode, onModeChange, prerequisites, onKillSwitch }: AutomationDashboardProps) {
    const [logs, setLogs] = useState<AuditEntry[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const fetchedLogs = getAuditLogs();
            if (fetchedLogs) {
                setLogs([...fetchedLogs].reverse().slice(0, 10));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const PrereqItem = ({ label, passed }: { label: string; passed: boolean }) => (
        <div className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
            <span className="text-white/40 font-mono">{label}</span>
            <span className={passed ? 'text-success' : 'text-error'}>
                {passed ? '✓ PASSED' : '✗ LOCKED'}
            </span>
        </div>
    );

    return (
        <div className="flex flex-col gap-4 p-4 h-full bg-black/40 overflow-hidden">

            {/* Header with Kill Switch */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className={mode !== 'OFF' ? 'text-accent animate-pulse' : 'text-white/20'} size={18} />
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Automation Engine</h2>
                </div>
                <button
                    onClick={onKillSwitch}
                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg transition-all active:scale-95"
                >
                    GLOBAL KILL SWITCH
                </button>
            </div>

            {/* Prerequisites Gate */}
            {!prerequisites.isUnlocked && (
                <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock size={14} className="text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase">Automation Locked</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <PrereqItem label="100+ Reviewed Trades" passed={prerequisites.tradeCountPassed} />
                        <PrereqItem label="Net Positive R" passed={prerequisites.expectancyPassed} />
                        <PrereqItem label="Discipline (>95% Compliance)" passed={prerequisites.disciplinePassed} />
                    </div>
                </div>
            )}

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-2">
                {(['STRATEGY_LIMITED', 'MULTI', 'FULL_SESSION'] as AutomationMode[]).map(m => (
                    <button
                        key={m}
                        disabled={!prerequisites.isUnlocked || mode === m}
                        onClick={() => onModeChange(m)}
                        className={`
                            px-3 py-2 rounded-lg text-[9px] font-bold border transition-all flex items-center justify-center gap-2
                            ${mode === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}
                            ${(!prerequisites.isUnlocked) ? 'opacity-20 cursor-not-allowed grayscale' : ''}
                        `}
                    >
                        {mode === m ? <Square size={12} fill="currentColor" /> : <Play size={12} />}
                        {m.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Real-time Audit Trail */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-2 text-white/40">
                    <History size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Live Audit Trail</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-black/40 rounded-lg border border-white/5 p-2 font-mono text-[9px]">
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/20 italic">
                            Waiting for execution events...
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-2 pb-2 border-b border-white/5 last:border-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={log.decision.action === 'BLOCK' ? 'text-red-400' : 'text-green-400'}>
                                        [{log.decision.action}] {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className="text-white/20 uppercase text-[7px]">{log.type}</span>
                                </div>
                                <div className="text-white/60 leading-tight">
                                    {log.decision.reason}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
