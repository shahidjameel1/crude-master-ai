import { motion } from 'framer-motion';
import { usePerformanceAnalytics } from '../hooks/usePerformanceAnalytics';
import { Trade } from '../hooks/usePaperTrading';

interface PLDashboardProps {
    tradeHistory: Trade[];
}

const MetricItem = ({ label, value, color, subValue, trend }: any) => (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] transition-all relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest relative z-10">{label}</span>
        <div className="flex items-baseline gap-2 relative z-10">
            <span className={`text-2xl font-bold font-heading drop-shadow-sm ${color}`}>{value}</span>
            {subValue && (
                <span className={`text-[10px] font-mono font-bold ${trend === 'up' ? 'text-success' : 'text-error'}`}>
                    {trend === 'up' ? '▲' : '▼'} {subValue}
                </span>
            )}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/[0.05] group-hover:bg-accent/40 transition-colors" />
    </div>
);

const CircularProgress = ({ percent, color, label }: { percent: number, color: string, label: string }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-2">{label}</span>
            <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="50%" cy="50%" r={radius}
                        stroke="currentColor" strokeWidth="4"
                        fill="transparent" className="text-white/5"
                    />
                    <motion.circle
                        cx="50%" cy="50%" r={radius}
                        stroke={color} strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{percent}%</span>
                </div>
            </div>
        </div>
    );
};

export function PLDashboard({ tradeHistory }: PLDashboardProps) {
    const { metrics } = usePerformanceAnalytics(tradeHistory);
    const { totalTrades, winRate, totalPnl, profitFactor, maxDrawdown } = metrics;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
            <MetricItem
                label="Total Net P&L"
                value={`₹${totalPnl.toLocaleString()}`}
                color={totalPnl >= 0 ? "text-success" : "text-error"}
                subValue={totalPnl >= 0 ? "PROFIT" : "LOSS"}
                trend={totalPnl >= 0 ? "up" : "down"}
            />
            <MetricItem
                label="Trade Count"
                value={totalTrades}
                color="text-accent"
            />
            <MetricItem
                label="Profit Factor"
                value={profitFactor.toFixed(2)}
                color="text-cyan"
            />

            <CircularProgress
                label="Win Rate"
                percent={Math.round(winRate)}
                color={winRate >= 50 ? "#10B981" : "#F59E0B"}
            />

            <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Drawdown</span>
                    <span className="text-[10px] font-bold text-error tracking-widest">{maxDrawdown.toFixed(1)} PTS</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((maxDrawdown / 50) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-error/60"
                    />
                </div>
                <span className="text-[9px] text-white/30 italic mt-2">Max risk exposure vs capital</span>
            </div>
        </motion.div>
    );
}
