import { useState, useEffect } from 'react';

export function SessionTimer() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = time.getHours();
    const isOpen = hours >= 10 && hours <= 22; // 10 AM - 10 PM

    return (
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Market Status</span>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${isOpen ? 'text-emerald-400' : 'text-rose-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                {isOpen ? 'LIVE' : 'CLOSED'}
            </span>
            {/* Time Display */}
            <span className="text-xs text-neutral-600 font-mono mt-0.5">
                {time.toLocaleTimeString('en-US', { hour12: false })} IST
            </span>
        </div>
    );
}
