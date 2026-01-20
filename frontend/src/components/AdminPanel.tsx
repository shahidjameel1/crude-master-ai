import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Settings, Database, Activity, Lock, EyeOff } from 'lucide-react';

export function AdminPanel() {
    const { isAdminPanelOpen, setUI, isCovertMode, toggleCovertMode } = useStore();

    if (!isAdminPanelOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setUI({ isAdminPanelOpen: false })}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-2xl bg-[#0A0E1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                            <Shield className="text-accent" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">{isCovertMode ? 'SECURE_TERM_V9' : 'Admin Operator Terminal'}</h2>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Secure Access // Identity Verified</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setUI({ isAdminPanelOpen: false })}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-white/20" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-2 gap-6">
                    <AdminCard
                        icon={<Activity size={18} />}
                        title="System Health"
                        status="OPTIONAL"
                        desc="Main loop latency: 12ms. WebSocket connected."
                    />
                    <AdminCard
                        icon={<Database size={18} />}
                        title="Data Persistence"
                        status="ACTIVE"
                        desc="Auto-save to LocalStorage enabled. Cache: 45MB."
                    />
                    <AdminCard
                        icon={<Settings size={18} />}
                        title="Risk Engine"
                        status="GATED"
                        desc="Hard-limits for MCX sessions are enforced."
                    />
                    <AdminCard
                        icon={<Lock size={18} />}
                        title="Auth Protocol"
                        status="SECURE"
                        desc="Session type: Private Local Administrator."
                    />
                    <div
                        onClick={toggleCovertMode}
                        className="cursor-pointer"
                    >
                        <AdminCard
                            icon={<EyeOff size={18} />}
                            title="Visual Security"
                            status={isCovertMode ? "ACTIVE" : "DISABLED"}
                            desc={isCovertMode ? "Covert Glyph Mode Enable. UI Obfuscated." : "Standard UI Mode. Click to Obfuscate."}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Terminal Live</span>
                    </div>
                    <button
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
                        onClick={() => setUI({ isAdminPanelOpen: false })}
                    >
                        Close Session
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function AdminCard({ icon, title, status, desc }: { icon: any, title: string, status: string, desc: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all group">
            <div className="flex items-center justify-between mb-3">
                <div className="text-accent/60 group-hover:text-accent transition-colors">
                    {icon}
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/5 text-white/40 group-hover:text-white transition-colors">
                    {status}
                </span>
            </div>
            <h3 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">{title}</h3>
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">{desc}</p>
        </div>
    );
}
