import { LuArrowUpRight, LuArrowDownRight, LuFilter } from "react-icons/lu";
import { Trade } from '../hooks/usePaperTrading';

interface TradeJournalProps {
    trades: Trade[];
}

export function TradeJournal({ trades: rawTrades }: TradeJournalProps) {
    // const [filter, setFilter] = useState('all');

    // Format trades for the table
    const trades = rawTrades.map(t => ({
        id: t.id,
        time: new Date(t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: t.direction,
        symbol: 'CRUDEOIL',
        entry: t.entryPrice,
        exit: t.exitPrice || '-',
        pl: t.pnl || 0,
        status: t.status === 'CLOSED' ? (t.pnl && t.pnl > 0 ? 'WIN' : 'LOSS') : 'OPEN'
    }));

    return (
        <div className="h-full bg-neutral-900/50 border border-white/10 rounded-xl p-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-neutral-400">Trade Journal</h3>
                <button className="p-1.5 hover:bg-white/5 rounded text-neutral-500">
                    <LuFilter size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {/* Desktop Table */}
                <table className="w-full text-xs text-left border-collapse hidden md:table">
                    <thead className="text-neutral-500 sticky top-0 bg-neutral-900/90 backdrop-blur z-10">
                        <tr>
                            <th className="font-medium p-2 border-b border-white/5">Time</th>
                            <th className="font-medium p-2 border-b border-white/5">Type</th>
                            <th className="font-medium p-2 border-b border-white/5">Entry</th>
                            <th className="font-medium p-2 border-b border-white/5">Exit</th>
                            <th className="font-medium p-2 border-b border-white/5 text-right">P&L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(trade => (
                            <tr key={trade.id} className="hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors group">
                                <td className="p-2 text-neutral-400 font-mono">{trade.time}</td>
                                <td className="p-2">
                                    <span className={`flex items-center gap-1 font-bold ${trade.type === 'LONG' ? 'text-primary' : 'text-rose-500'}`}>
                                        {trade.type === 'LONG' ? <LuArrowUpRight size={12} /> : <LuArrowDownRight size={12} />}
                                        {trade.type}
                                    </span>
                                </td>
                                <td className="p-2 text-neutral-300">{trade.entry}</td>
                                <td className="p-2 text-neutral-300">{trade.exit}</td>
                                <td className="p-2 text-right font-medium">
                                    <span className={trade.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {trade.pl >= 0 ? '+' : ''}{trade.pl}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="flex flex-col gap-3 md:hidden">
                    {trades.map(trade => (
                        <div key={trade.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-neutral-500 font-mono">{trade.time}</span>
                                <span className={`flex items-center gap-1 font-bold text-xs ${trade.type === 'LONG' ? 'text-primary' : 'text-rose-500'}`}>
                                    {trade.type === 'LONG' ? <LuArrowUpRight size={14} /> : <LuArrowDownRight size={14} />}
                                    {trade.type}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-[8px] uppercase text-neutral-500">Entry</span>
                                    <span className="text-xs font-bold text-white font-mono">{trade.entry}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] uppercase text-neutral-500">P&L</span>
                                    <span className={`text-xs font-bold font-mono ${trade.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {trade.pl >= 0 ? '+' : ''}{trade.pl}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
