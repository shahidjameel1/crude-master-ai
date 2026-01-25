import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const usePanicGesture = () => {
    const triggerKillSwitch = useStore((state) => state.triggerKillSwitch);

    // Use ref to keep track of taps without re-rendering
    const tapsRef = useRef<number[]>([]);

    useEffect(() => {
        const handleTouchStart = () => {
            const now = Date.now();

            // Clean up old taps
            tapsRef.current = tapsRef.current.filter(t => now - t < 1200);

            // Add new tap
            tapsRef.current.push(now);

            // Check for 3 taps within window
            if (tapsRef.current.length >= 3) {
                console.warn("🚨 PANIC GESTURE DETECTED: 3 Taps within 1.2s");

                // Trigger Global Kill Switch
                triggerKillSwitch();

                // Clear taps to prevent double trigger
                tapsRef.current = [];

                // Haptic Feedback (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 500]);
                }
            }
        };

        // Attach to window capture phase to bypass UI blocks
        window.addEventListener('touchstart', handleTouchStart, { capture: true });

        // Also support triple-click for desktop testing/safety
        window.addEventListener('mousedown', handleTouchStart, { capture: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart, { capture: true });
            window.removeEventListener('mousedown', handleTouchStart, { capture: true });
        };
    }, [triggerKillSwitch]);

    return null;
};
