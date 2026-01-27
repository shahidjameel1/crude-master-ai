import { LuShield, LuLock, LuMicroscope, LuChevronRight } from "react-icons/lu";
import { Insight } from '../hooks/useInsightEngine';

export function InsightPanel({ insight }: { insight: Insight }) {
    const qualityColors = {
        HIGH_QUALITY: 'text-accent border-accent bg-accent/10',
        GOOD: 'text-success border-success bg-success/10',
        WEAK: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
        NOISE: 'text-white/20 border-white/10 bg-white/5'
    };

    return (
        <div className="w-72 flex flex-col gap-3 p-4 glass-dark rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden max-h-[80vh] overflow-y-auto custom-scrollbar">

            {/* Institutional Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <LuMicroscope size={14} className="text-accent" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Institutional Review</span>
                </div>
                <div className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase ${qualityColors[insight.quality]}`}>
                    {insight.quality.replace('_', ' ')}
                </div>
            </div>

            {/* Headline Tone */}
            <div className="py-2">
                <p className="text-[11px] font-medium text-white/90 leading-relaxed font-heading italic">
                    {insight.headline}
                </p>
            </div>

            {/* Automation Status Gating */}
            <div className={`p-2 rounded-lg border flex items-center justify-between ${insight.automationEligible ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-2">
                    <LuShield size={12} className={insight.automationEligible ? 'text-accent' : 'text-white/20'} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${insight.automationEligible ? 'text-white' : 'text-white/40'}`}>
                        Execution Engine
                    </span>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${insight.automationEligible ? 'bg-accent text-white' : 'bg-white/10 text-white/20 uppercase'}`}>
                    {insight.automationEligible ? 'ELIGIBLE' : 'ADVISORY ONLY'}
                </span>
            </div>

            {/* Evidence List (Institutional Narrative) */}
            <div className="flex flex-col gap-1.5 py-1">
                {insight.details.map((detail, i) => (
                    <div key={i} className="flex items-start gap-2 group">
                        <LuChevronRight size={10} className="text-accent mt-1 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors leading-tight">
                            {detail}
                        </p>
                    </div>
                ))}
            </div>

            {/* Compliance Footnote */}
            {insight.automationEligible && (
                <div className="flex items-center gap-2 mt-1 p-2 bg-accent/5 rounded-lg border border-accent/10">
                    <LuLock size={12} className="text-accent/60" />
                    <span className="text-[8px] text-accent/60 font-mono uppercase leading-tight">
                        {"Institutional Rule: Confluence >= 80 satisfied. Automation boundaries compliant."}
                    </span>
                </div>
            )}
        </div>
    );
}
