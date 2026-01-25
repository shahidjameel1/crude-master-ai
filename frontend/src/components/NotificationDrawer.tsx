import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Bell, X, CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export function NotificationDrawer() {
    const { isNotificationDrawerOpen, setUI, notifications } = useStore();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                // Only close if it's actually open to avoid initial trigger issues
                if (isNotificationDrawerOpen) {
                    setUI({ isNotificationDrawerOpen: false });
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isNotificationDrawerOpen, setUI]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle size={16} className="text-green-400" />;
            case 'WARNING': return <AlertTriangle size={16} className="text-yellow-400" />;
            case 'ERROR': return <AlertOctagon size={16} className="text-red-400" />;
            default: return <Info size={16} className="text-blue-400" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'border-green-500/20 bg-green-500/5';
            case 'WARNING': return 'border-yellow-500/20 bg-yellow-500/5';
            case 'ERROR': return 'border-red-500/20 bg-red-500/5';
            default: return 'border-white/10 bg-white/5';
        }
    };

    return (
        <AnimatePresence>
            {isNotificationDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]"
                    />

                    {/* Drawer */}
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0A0A0A] border-l border-white/10 z-[160] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                            <div className="flex items-center gap-2">
                                <Bell size={16} className="text-accent" />
                                <span className="text-xs font-black uppercase tracking-widest text-white/80">System Alerts</span>
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-white/60">{notifications.length}</span>
                            </div>
                            <button
                                onClick={() => setUI({ isNotificationDrawerOpen: false })}
                                className="p-1 hover:bg-white/5 rounded transition-colors"
                            >
                                <X size={16} className="text-white/40 hover:text-white" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-white/20 gap-2">
                                    <Bell size={24} className="opacity-20" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold">No New Alerts</span>
                                </div>
                            ) : (
                                [...notifications].reverse().map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-3 rounded-lg border flex gap-3 ${getColor(n.type)}`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                                                {new Date(n.timestamp).toLocaleTimeString()}
                                            </span>
                                            <p className="text-[11px] font-medium text-white/90 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
