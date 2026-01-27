import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { LuTrendingUp, LuAward, LuCircleAlert, LuActivity, LuClock } from "react-icons/lu";

export function PerformanceDashboard() {
    const { tradeHistory, equityCurve, accountSize } = useStore();

    const stats = useMemo(() => {
        if (tradeHistory.length === 0) return { winRate: 0, totalPnL: 0, avgR: 0, totalTrades: 0, violations: 0 };

        const wins = tradeHistory.filter(t => t.pnl > 0).length;
        const totalPnL = tradeHistory.reduce((sum, t) => sum + t.pnl, 0);
        const avgR = tradeHistory.reduce((sum, t) => sum + t.rMultiple, 0) / tradeHistory.length;
        const violations = tradeHistory.filter(t => t.wasRuleViolation).length;

        return {
            winRate: (wins / tradeHistory.length) * 100,
            totalPnL,
            avgR: Number(avgR.toFixed(2)),
            totalTrades: tradeHistory.length,
            violations
        };
    }, [tradeHistory]);

    return (
        <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-black/60 backdrop-blur-3xl border border-white/5 md:rounded-3xl h-full overflow-y-auto custom-scrollbar">

            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                    label="Portfolio Equity"
                    value={`₹${(accountSize + stats.totalPnL).toLocaleString()}`}
                    sub={`${stats.totalPnL >= 0 ? '+' : ''}₹${stats.totalPnL.toLocaleString()}`}
                    icon={<LuTrendingUp className="text-accent" size={16} />}
                />
                <StatCard
                    label="Win Rate"
                    value={`${stats.winRate.toFixed(1)}%`}
                    sub={`${stats.totalTrades} Trades`}
                    icon={<LuAward className="text-green-400" size={16} />}
                />
                <StatCard
                    label="Avg R-Mult"
                    value={`${stats.avgR}R`}
                    sub="Efficiency"
                    icon={<LuActivity className="text-indigo-400" size={16} />}
                />
                <StatCard
                    label="Discipline"
                    value={`${Math.max(0, 100 - (stats.violations * 10))}%`}
                    sub={`${stats.violations} Breaches`}
                    icon={<LuCircleAlert className={stats.violations > 0 ? 'text-red-500 animate-pulse' : 'text-white/20'} size={16} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-wrap lg:flex-nowrap">
                {/* Equity Curve Placeholder */}
                <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 min-h-[200px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Equity Growth Cycle</span>
                        <div className="flex gap-1 md:gap-2">
                            {['1D', '1W', 'ALL'].map(t => (
                                <button key={t} className="px-2 py-0.5 rounded text-[8px] bg-white/5 text-white/40 hover:bg-white/10">{t}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-1 px-1 pb-2 md:px-2 md:pb-4">
                        {equityCurve.length < 2 ? (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/10 uppercase tracking-[0.3em] font-black italic text-center p-4">
                                Waiting for Telemetry...
                            </div>
                        ) : (
                            equityCurve.map((point, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(point.balance / (accountSize * 1.2)) * 100}%` }}
                                    className="flex-1 bg-accent/20 border-t border-accent/40 rounded-t-sm"
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Performance Calendar Heatmap */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">P&L Thermal Map</span>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} className={`aspect-square rounded-sm border border-white/5 ${i === 12 ? 'bg-green-500/40' : i === 15 ? 'bg-red-500/40' : 'bg-white/5'}`} />
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] text-white/20 uppercase font-black">
                        <span>Past 4 Weeks</span>
                    </div>
                </div>
            </div>

            {/* Trade History Table */}
            <div className="flex-1 min-h-[300px] bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Execution Stream</span>

                {/* Desktop View */}
                <div className="hidden lg:block flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="text-[8px] text-white/20 uppercase font-black border-b border-white/5">
                            <tr>
                                <th className="pb-2">Time</th>
                                <th className="pb-2">Action</th>
                                <th className="pb-2">Entry</th>
                                <th className="pb-2">Exit</th>
                                <th className="pb-2">R-Mult</th>
                                <th className="pb-2 text-right">Result</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] font-mono">
                            {tradeHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-white/10 uppercase tracking-[0.2em] italic">No archived trades found.</td>
                                </tr>
                            ) : (
                                tradeHistory.slice(-10).reverse().map(trade => (
                                    <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="py-3 text-white/40 flex items-center gap-2">
                                            <LuClock size={10} />
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${trade.side === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {trade.side}
                                            </span>
                                        </td>
                                        <td className="py-3 text-white/60">₹{trade.entryPrice.toLocaleString()}</td>
                                        <td className="py-3 text-white/60">₹{trade.exitPrice?.toLocaleString() || '-'}</td>
                                        <td className="py-3 text-accent font-black">{trade.rMultiple}R</td>
                                        <td className={`py-3 text-right font-black ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
                    {tradeHistory.length === 0 ? (
                        <div className="py-8 text-center text-white/10 text-[10px] uppercase tracking-[0.2em] italic">No archived trades found.</div>
                    ) : (
                        tradeHistory.slice(-10).reverse().map(trade => (
                            <div key={trade.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] text-white/40 font-mono italic">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${trade.side === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {trade.side}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-white/20 uppercase font-black">Result</span>
                                        <span className={`text-[11px] font-black ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[7px] text-white/20 uppercase font-black">Efficiency</span>
                                        <span className="text-[11px] font-black text-accent">{trade.rMultiple}R</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-xl font-black text-white mb-0.5 group-hover:scale-105 transition-transform origin-left">{value}</div>
            <div className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">{sub}</div>
        </div>
    );
}
