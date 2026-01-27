import { useStore } from '../store/useStore';
import { LuRefreshCw, LuInfo } from "react-icons/lu";

export function SessionIntelligenceBadge() {
    const { sessionProfile } = useStore();

    const profileColors = {
        ASIA: 'text-purple-400 border-purple-400/20 bg-purple-400/10',
        LONDON: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
        NY: 'text-green-400 border-green-400/20 bg-green-400/10'
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 group relative">
            <LuRefreshCw size={12} className="text-accent" />
            <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Session Intelligence</span>
                <span className={`text-[9px] font-bold ${profileColors[sessionProfile].split(' ')[0]}`}>
                    {sessionProfile} Profile Active
                </span>
            </div>
            <LuInfo size={10} className="text-white/20" />

            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <LuRefreshCw size={12} className="text-accent" />
                    <span className="text-[9px] font-black uppercase text-accent">Session-Scoped Intelligence</span>
                </div>
                <p className="text-[9px] text-white/80 leading-relaxed mb-2">
                    Evolution logs, regime detection, and session profiles are active for this session only.
                </p>
                <p className="text-[8px] text-white/40 leading-relaxed">
                    State resets on page refresh. Backend persistence will be added in a future update.
                </p>
            </div>
        </div>
    );
}
