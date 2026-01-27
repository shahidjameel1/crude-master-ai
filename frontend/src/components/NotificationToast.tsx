import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { LuX, LuInfo, LuCircleCheck, LuTriangleAlert, LuOctagonAlert } from "react-icons/lu";

export function NotificationToast() {
    const { notifications, removeNotification } = useStore();

    return (
        <div className="fixed top-20 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className="pointer-events-auto"
                    >
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[400px] ${n.type === 'SUCCESS' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                            n.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                n.type === 'ERROR' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            <div className="shrink-0">
                                {n.type === 'SUCCESS' && <LuCircleCheck size={18} />}
                                {n.type === 'WARNING' && <LuTriangleAlert size={18} />}
                                {n.type === 'ERROR' && <LuOctagonAlert size={18} />}
                                {n.type === 'INFO' && <LuInfo size={18} />}
                            </div>

                            <div className="flex-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5">{n.type}</p>
                                <p className="text-xs text-white/80 font-medium leading-relaxed">{n.message}</p>
                            </div>

                            <button
                                onClick={() => removeNotification(n.id)}
                                className="shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <LuX size={14} className="text-white/20" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
