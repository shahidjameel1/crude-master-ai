import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface HoldToConfirmProps {
    onConfirm: () => void;
    onCancel?: () => void;
    text: string;
    holdTime?: number; // ms
    color?: string;
}

export function HoldToConfirm({ onConfirm, onCancel, text, holdTime = 2500, color = 'bg-success' }: HoldToConfirmProps) {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const startHolding = () => {
        setIsHolding(true);
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min(1, elapsed / holdTime);
            setProgress(newProgress);

            if (newProgress >= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                onConfirm();
                // Haptic feedback if available
                if (window.navigator.vibrate) window.navigator.vibrate(50);
            }
        }, 16);
    };

    const stopHolding = () => {
        setIsHolding(false);
        setProgress(0);
        if (timerRef.current) clearInterval(timerRef.current);
        if (onCancel) onCancel();
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <motion.button
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            className={`relative w-full h-16 rounded-2xl overflow-hidden font-black uppercase text-sm tracking-widest transition-all ${isHolding ? 'scale-[0.98]' : 'scale-100 hover:scale-[1.01]'
                } bg-white/5 border border-white/10`}
        >
            {/* Progress Background */}
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                className={`absolute inset-y-0 left-0 ${color} opacity-20`}
                transition={{ duration: 0.1 }}
            />

            {/* Content Overlay */}
            <div className="relative z-10 flex items-center justify-center gap-3 px-6 h-full">
                {progress >= 1 ? (
                    <>
                        <CheckCircle2 className="text-white" size={20} />
                        <span className="text-white">Confirmed</span>
                    </>
                ) : (
                    <>
                        <ShieldCheck className={isHolding ? 'text-white' : 'text-white/40'} size={20} />
                        <span className={isHolding ? 'text-white' : 'text-white/60'}>
                            {isHolding ? 'Holding...' : text}
                        </span>
                    </>
                )}
            </div>

            {/* Instruction Footer (Tiny) */}
            <div className="absolute bottom-1.5 left-0 w-full text-center">
                <span className="text-[7px] text-white/20 uppercase font-bold tracking-[0.2em]">
                    {isHolding ? 'Keep holding until full' : 'Press & Hold 2.5s for safety'}
                </span>
            </div>

            {/* Gloss Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
        </motion.button>
    );
}
