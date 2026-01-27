import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { LuShieldCheck } from "react-icons/lu";

export function ConfidenceMeter() {
    const { confidenceDetail, agentState } = useStore();
    const { score, breakdown } = confidenceDetail;

    // Only show when there is actual confidence data or Agent is Analyzing/ready
    if (score === 0 && agentState === 'IDLE') return null;

    const getColor = (s: number) => {
        if (s >= 80) return 'text-green-400 stroke-green-500';
        if (s >= 50) return 'text-yellow-400 stroke-yellow-500';
        return 'text-white/20 stroke-white/20';
    };

    const colorClass = getColor(score);
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col gap-3 bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
            {/* Header */}
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <LuShieldCheck size={14} className={score >= 80 ? 'text-green-400' : 'text-white/40'} />
                    <span className={score >= 80 ? 'text-green-400' : 'text-white/40'}>🛡️</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Signal Confidence</span>
                </div>
                <span className={`text-xs font-black font-mono ${colorClass.split(' ')[0]}`}>{score}%</span>
            </div>

            {/* Main Visual: Radial Meter */}
            <div className="flex items-center justify-center py-2 relative z-10">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="absolute inset-0 transform -rotate-90" width="96" height="96">
                        <circle
                            cx="48" cy="48" r={radius}
                            stroke="currentColor" strokeWidth="6" fill="transparent"
                            className="text-white/5"
                        />
                        {/* Progress Circle */}
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            cx="48" cy="48" r={radius}
                            stroke="currentColor" strokeWidth="6" fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            className={colorClass.split(' ')[1]} // Extracts stroke class
                        />
                    </svg>

                    {/* Center Text */}
                    <div className="flex flex-col items-center">
                        <span className={`text-2xl font-black ${colorClass.split(' ')[0]}`}>{score}</span>
                        <span className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Score</span>
                    </div>
                </div>
            </div>

            {/* Breakdown (Reveals on Hover/Always visible if critical) */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5 z-10">
                {Object.entries(breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-[9px]">
                        <span className="text-white/40 uppercase font-bold tracking-wide">{key}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${value}%` }}
                                    className={`h-full rounded-full ${value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-white/20'}`}
                                />
                            </div>
                            <span className="font-mono text-white/60 w-6 text-right">{value}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${score >= 80 ? 'from-green-500/10' : score >= 50 ? 'from-yellow-500/10' : 'from-white/5'} to-transparent blur-2xl rounded-full pointer-events-none transition-colors duration-500`} />
        </div>
    );
}
