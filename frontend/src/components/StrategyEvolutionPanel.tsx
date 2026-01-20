import { Zap, Shield, Microscope, CheckCircle, Info } from 'lucide-react';
import { StrategyEvolution } from '../hooks/useSafeLearning';

interface StrategyEvolutionPanelProps {
    suggestions: StrategyEvolution[];
    onApprove: (strategyName: string) => void;
}

export function StrategyEvolutionPanel({ suggestions, onApprove }: StrategyEvolutionPanelProps) {
    if (suggestions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-black/40">
                <Microscope size={32} className="text-white/10 mb-2" />
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">
                    Agent Observation Active...<br />
                    Gathering behavioral evidence.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 h-full bg-black/40 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Zap size={16} className="text-accent" />
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Strategy Evolutions</h2>
            </div>

            {suggestions.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                        <CheckCircle size={14} className="text-accent/40" />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-accent mb-1">{s.strategyName}</h3>
                        <p className="text-[10px] text-white/60 italic leading-snug">{s.whyThisStrategyWorks}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                        <div className="bg-black/20 p-2 rounded border border-white/5">
                            <span className="text-white/20 block mb-1 uppercase">Condition</span>
                            <span className="text-white/80">{s.marketCondition}</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded border border-white/5">
                            <span className="text-white/20 block mb-1 uppercase">Session</span>
                            <span className="text-white/80">{s.sessionAllowed}</span>
                        </div>
                    </div>

                    <div className="bg-black/40 p-2 rounded border border-white/5 flex flex-col gap-1">
                        <span className="text-[8px] text-white/20 uppercase font-bold tracking-tighter">Entry Protocol</span>
                        {s.entryConditions.map((cond, i) => (
                            <div key={i} className="flex items-center gap-2 text-[9px] text-white/60">
                                <div className="w-1 h-1 rounded-full bg-accent/40" />
                                {cond}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-[9px] pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-white/20 uppercase text-[8px]">Evidence Base</span>
                            <span className="text-accent font-bold">{s.evidence}</span>
                        </div>
                        <button
                            onClick={() => onApprove(s.strategyName)}
                            className="bg-accent/20 hover:bg-accent/40 text-accent text-[9px] font-bold px-3 py-1 rounded-full border border-accent/30 transition-all active:scale-95"
                        >
                            APPROVE EVOLUTION
                        </button>
                    </div>

                    <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/10 flex items-start gap-2">
                        <Shield size={12} className="text-red-500/40 mt-0.5" />
                        <span className="text-[8px] text-white/40 uppercase leading-tight font-mono">
                            <span className="text-red-500/60 font-bold">Safe Law:</span> {s.whenNotToUseIt}
                        </span>
                    </div>
                </div>
            ))}

            <div className="mt-4 flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                <Info size={14} className="text-white/20 mt-0.5" />
                <p className="text-[8px] text-white/40 uppercase tracking-tight leading-normal font-mono">
                    All strategy changes require human approval. The agent never self-updates without verification.
                </p>
            </div>
        </div>
    );
}
