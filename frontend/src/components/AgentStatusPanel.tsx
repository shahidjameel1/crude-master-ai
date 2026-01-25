import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Activity, ShieldCheck, AlertTriangle, Search, Zap, Clock, Disc, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AgentStatusPanel() {
    const {
        agentState,
        agentReason,
        lastAgentAction,
        isMarketOpen,
        automationMode,
        opportunityScore
    } = useStore();

    const [timeSinceLastAction, setTimeSinceLastAction] = useState<string>('0s');

    useEffect(() => {
        const interval = setInterval(() => {
            const seconds = Math.floor((Date.now() - lastAgentAction) / 1000);
            if (seconds < 60) {
                setTimeSinceLastAction(`${seconds}s`);
            } else {
                setTimeSinceLastAction(`${Math.floor(seconds / 60)}m`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastAgentAction]);

    const getStateConfig = (state: string) => {
        switch (state) {
            case 'SEARCHING':
                return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Search, label: 'SEARCHING', glow: 'shadow-blue-glow' };
            case 'ANALYZING':
                return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Activity, label: 'ANALYZING', glow: 'shadow-yellow-glow' };
            case 'READY':
                return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: ShieldCheck, label: 'READY', glow: 'shadow-green-glow' };
            case 'EXECUTING':
                return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Zap, label: 'EXECUTING', glow: 'shadow-red-glow' };
            case 'COOLDOWN':
                return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Clock, label: 'COOLDOWN', glow: 'shadow-purple-glow' };
            case 'ERROR':
                return { color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle, label: 'ERROR', glow: 'shadow-error-glow' };
            default:
                return { color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10', icon: Disc, label: 'IDLE', glow: '' };
        }
    };

    const config = getStateConfig(agentState);
    const Icon = config.icon;

    return (
        <div className="flex flex-col gap-2 min-w-[240px]">
            {/* Header: Agent State (Large & Clear) */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${config.bg} ${config.border}`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icon size={20} className={config.color} />
                        <span className={`absolute top-0 right-0 w-2 h-2 rounded-full ${agentState === 'EXECUTING' || agentState === 'ANALYZING' ? 'bg-white animate-ping' : ''}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-[13px] font-black tracking-widest uppercase ${config.color} ${config.glow}`}>
                            {config.label}
                        </span>
                        <span className="text-[9px] font-bold text-white/50 leading-none mt-0.5">
                            {agentReason}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sub-Panel: Market & Automation Context */}
            <div className="flex items-center gap-2">
                {/* Market Status Chip */}
                <div className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded border ${isMarketOpen ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <span className="text-[8px] font-black uppercase text-white/40">Market</span>
                    <span className={`text-[9px] font-bold uppercase ${isMarketOpen ? 'text-green-500' : 'text-red-500'}`}>
                        {isMarketOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                </div>

                {/* Automation Status Chip */}
                <div className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded border ${automationMode === 'AUTO' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/5 border-white/10'}`}>
                    <span className="text-[8px] font-black uppercase text-white/40">Auto</span>
                    <div className="flex items-center gap-1">
                        {automationMode === 'OFF' && <Lock size={8} className="text-white/40" />}
                        <span className={`text-[9px] font-bold uppercase ${automationMode === 'AUTO' ? 'text-cyan-400' : 'text-white/40'}`}>
                            {automationMode}
                        </span>
                    </div>
                </div>

                {/* Heartbeat / Last Action */}
                <div className="flex items-center justify-center px-2 py-1.5 rounded bg-white/5 border border-white/10 min-w-[50px]">
                    <span className="text-[9px] font-mono text-white/60">{timeSinceLastAction}</span>
                </div>
            </div>
        </div>
    );
}
