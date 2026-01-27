import { LuTrophy, LuInfo, LuHistory, LuX } from "react-icons/lu";
import { Trade } from '../hooks/usePaperTrading';

interface TradeReportModalProps {
    trade: Trade;
    onClose: () => void;
}

export function TradeReportModal({ trade, onClose }: TradeReportModalProps) {
    const { pnl, grade, feedback, snapshot, sl, tp } = trade;

    const getGradeColor = () => {
        if (grade?.startsWith('A')) return 'text-success';
        if (grade?.startsWith('B')) return 'text-cyan';
        if (grade?.startsWith('C')) return 'text-warning';
        return 'text-error';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-2">
                        <LuTrophy className="text-accent" size={20} />
                        <h3 className="font-bold text-white tracking-tight">Trade Performance Report</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <LuX size={20} className="text-white/40" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    <div className="text-center mb-8">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-1">Execution Grade</p>
                        <h2 className={`text-6xl font-black ${getGradeColor()}`}>{grade}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] text-white/40 uppercase font-mono mb-1">Net P&L</p>
                            <p className={`text-xl font-bold ${(pnl || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                                ₹{(pnl || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] text-white/40 uppercase font-mono mb-1">Parameters</p>
                            <p className="text-xs font-medium text-white/80">SL: {sl || '-'} | TP: {tp || '-'}</p>
                        </div>
                    </div>

                    {/* Feedback Section */}
                    <div className="space-y-4">
                        <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <LuInfo size={16} className="text-accent" />
                                <span className="text-xs font-bold text-accent uppercase tracking-wider">AI Feedback</span>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed italic">"{feedback}"</p>
                        </div>

                        {/* Snapshot Context */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <LuHistory size={16} className="text-white/40" />
                                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Market Context at Entry</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2">
                                <div className="flex justify-between items-center pr-4 border-r border-white/5">
                                    <span className="text-[10px] text-white/30">Confluence</span>
                                    <span className="text-[10px] font-mono text-white/80">{snapshot.score}/100</span>
                                </div>
                                <div className="flex justify-between items-center pl-4">
                                    <span className="text-[10px] text-white/30">Regime</span>
                                    <span className="text-[10px] font-mono text-white/80">{snapshot.trend}</span>
                                </div>
                                <div className="flex justify-between items-center pr-4 border-r border-white/5">
                                    <span className="text-[10px] text-white/30">Risk Lvl</span>
                                    <span className="text-[10px] font-mono text-success">SAFE</span>
                                </div>
                                <div className="flex justify-between items-center pl-4">
                                    <span className="text-[10px] text-white/30">Kill Zone</span>
                                    <span className="text-[10px] font-mono text-white/80">{snapshot.isKillZone ? 'YES' : 'NO'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 text-center">
                    <button
                        onClick={onClose}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition-all shadow-blue-glow active:scale-[0.98]"
                    >
                        JOURNAL COMPLETED
                    </button>
                </div>
            </div>
        </div>
    );
}
