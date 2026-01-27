import { motion } from 'framer-motion';
import { LuCalendar, LuClock, LuCircleAlert, LuTrendingUp } from "react-icons/lu";

interface EconomicEvent {
    id: string;
    title: string;
    time: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    previous?: string;
    forecast?: string;
    actual?: string;
}

const CRUDE_EVENTS: EconomicEvent[] = [
    { id: '1', title: 'EIA Crude Oil Inventories', time: 'Wed 21:00', impact: 'HIGH', previous: '-2.1M', forecast: '+1.2M' },
    { id: '2', title: 'OPEC JMMC Meeting', time: 'Thu 14:00', impact: 'HIGH', previous: 'N/A', forecast: 'N/A' },
    { id: '3', title: 'US CPI (MoM)', time: 'Tue 19:00', impact: 'HIGH', previous: '0.3%', forecast: '0.2%' },
    { id: '4', title: 'Baker Hughes Rig Count', time: 'Fri 23:30', impact: 'MEDIUM', previous: '488', forecast: '490' },
    { id: '5', title: 'API Weekly Statistical Bulletin', time: 'Wed 02:00', impact: 'HIGH', previous: '-1.5M', forecast: '-0.8M' },
];

export function EconomicCalendar() {
    return (
        <div className="flex flex-col gap-6 p-6 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-3xl h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <LuCalendar className="text-accent" size={20} />
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Fundamental Pulse</h2>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-black">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> High Impact</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Medium Impact</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {CRUDE_EVENTS.map((event) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group flex items-center gap-6 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Impact Glow */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.impact === 'HIGH' ? 'bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.5)]' :
                            event.impact === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'
                            }`} />

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <LuClock size={12} className="text-white/20" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{event.time}</span>
                            </div>
                            <h3 className="text-sm font-black text-white group-hover:text-accent transition-colors">{event.title}</h3>
                        </div>

                        <div className="flex gap-8 text-right pr-4 font-mono">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-white/20 uppercase font-black">Previous</span>
                                <span className="text-xs text-white/60">{event.previous}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] text-white/20 uppercase font-black">Forecast</span>
                                <span className="text-xs text-white/60">{event.forecast}</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-[60px]">
                                <span className="text-[8px] text-accent uppercase font-black">Actual</span>
                                <span className="text-xs text-white font-black">{event.actual || '---'}</span>
                            </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <LuTrendingUp size={16} className="text-accent" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-auto p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4">
                <LuCircleAlert size={20} className="text-accent shrink-0 mt-1" />
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">WTI/BRENT Alert</h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                        Volatility spikes typically occur ±5 minutes around EIA reports. Institutional rules enforce <strong>Execution Gating</strong> during these windows.
                    </p>
                </div>
            </div>
        </div>
    );
}
