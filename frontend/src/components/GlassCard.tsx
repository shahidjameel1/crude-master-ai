import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, MouseEvent } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    tilt?: boolean;
}

export function GlassCard({ children, className, tilt = true }: GlassCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg']);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!tilt) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: tilt ? rotateX : 0,
                rotateY: tilt ? rotateY : 0,
                transformStyle: 'preserve-3d',
            }}
            className={cn(
                "glass will-change-transform group transition-all duration-300",
                className
            )}
        >
            <div style={{ transform: 'translateZ(20px)' }} className="h-full w-full">
                {children}
            </div>
        </motion.div>
    );
}
