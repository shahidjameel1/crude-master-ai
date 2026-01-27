import { useStore } from '../store/useStore';

export function AgentStatusPill() {
    const { agentState, agentReason, lastAgentAction, latencyMs } = useStore();

    const getStatusLabel = () => {
        if (agentState === 'IDLE') return 'PAUSED';
        return agentState;
    };

    const getColor = () => {
        switch (agentState) {
            case 'SEARCHING': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
            case 'ANALYZING': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'READY': return 'text-green-400 bg-green-400/10 border-green-500/20';
            case 'EXECUTING': return 'text-red-500 bg-red-400/10 border-red-500/20 animate-pulse';
            case 'COOLDOWN': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'ERROR': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-white/40 bg-white/5 border-white/10';
        }
    };

    const baseClass = getColor();

    return (
        <div className="flex flex-col items-start gap-1">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-500 ${baseClass}`}>
                <span className="relative flex h-2 w-2">
                    {agentState === 'SEARCHING' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40 duration-1000"></span>
                    )}
                    {agentState === 'ANALYZING' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-60 duration-700"></span>
                    )}
                    {agentState === 'EXECUTING' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 duration-300"></span>
                    )}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
                <span className="text-[9px] font-black tracking-widest uppercase">{getStatusLabel()}</span>
                <div className="h-2.5 w-px bg-white/10 mx-0.5" />
                <span className="text-[8px] font-mono opacity-60">{latencyMs}ms</span>
            </div>

            {/* Transparency: Why agent is waiting */}
            {agentState !== 'IDLE' && agentReason && (
                <div className="flex items-center gap-1.5 px-2">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[8px] text-white/40 font-bold uppercase tracking-tight">
                        {agentReason}
                    </span>
                    <span className="text-[7px] font-mono text-white/20">
                        {new Date(lastAgentAction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            )}
        </div>
    );
}
