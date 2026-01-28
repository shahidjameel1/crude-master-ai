import { LuPower, LuPause, LuPlay, LuMenu } from "react-icons/lu";
import { useState } from 'react';
import { motion } from 'framer-motion';

import { useStore } from '../store/useStore';

export function ControlPanel() {
    const { automationMode, setAutomationMode } = useStore();
    const isAutoTrading = automationMode === 'AUTO';
    const [riskLevel, setRiskLevel] = useState(1);
    // glassMode removed as unused

    // API handlers (mocked for now, replace with store actions)
    // API handlers (mocked for now, replace with store actions)
    // toggleGlassMode removed as it was unused.

    const activateKillSwitch = async () => {
        if (!confirm("⚠️ ACTIVATE EMERGENCY KILL SWITCH? This will close all positions and lock the system.")) return;
        try {
            const token = localStorage.getItem('friday_auth_token');
            await fetch('/api/security/kill', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAutomationMode('OFF');
            alert("SYSTEM LOCKED. RED ALERT.");
        } catch (e) {
            console.error("Kill switch failed", e);
        }
    };

    return (
        <div className="h-full flex flex-col justify-between p-2">
            <div>
                <div className="flex items-center justify-between mb-6 border-b border-border pb-2 px-2">
                    <div className="flex items-center gap-2">
                        <LuMenu size={14} className="text-accent" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary font-heading">Control matrix</h3>
                    </div>
                    {/* Settings button removed as unused */}
                </div>

                {/* Tactical Toggle Switch */}
                <div className="flex items-center justify-between mb-6 p-4 bg-black/40 rounded-2xl border border-white/5 shadow-inner backdrop-blur-sm group">
                    <div>
                        <span className="text-xs font-bold text-white block">Auto-Trade Protocol</span>
                        <span className="text-[10px] text-text-tertiary">Autonomous Execution Engine</span>
                    </div>
                    <motion.button
                        layout
                        onClick={() => setAutomationMode(isAutoTrading ? 'OFF' : 'AUTO')}
                        className={`w-14 h-7 rounded-full p-1 transition-all duration-500 relative flex items-center ${isAutoTrading ? 'bg-success/20 ring-1 ring-success/50' : 'bg-white/5 ring-1 ring-white/10'}`}
                    >
                        <motion.div
                            layout
                            className={`w-5 h-5 rounded-full shadow-lg ${isAutoTrading ? 'bg-success shadow-success-glow ml-auto' : 'bg-text-tertiary'}`}
                        />
                        {isAutoTrading && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute right-2 w-3 h-3 rounded-full bg-success/40"
                            />
                        )}
                    </motion.button>
                </div>

                {/* Volumetric Risk Slider */}
                <div className="px-2">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Risk Magnitude</span>
                        <span className="text-xs font-bold text-cyan font-mono px-2 py-0.5 bg-cyan/10 rounded border border-cyan/20">{riskLevel}% (Moderate)</span>
                    </div>
                    <div className="relative h-6 flex items-center group">
                        <div className="absolute inset-0 h-1.5 bg-black/40 rounded-full border border-white/5 my-auto" />
                        <motion.div
                            className="absolute left-0 h-1.5 bg-gradient-to-r from-accent to-cyan rounded-full my-auto"
                            style={{ width: `${(riskLevel / 3) * 100}%` }}
                        />
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.5"
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                        />
                        <motion.div
                            className="absolute w-4 h-4 rounded-sm bg-white border-2 border-accent shadow-blue-glow pointer-events-none"
                            style={{ left: `calc(${(riskLevel / 3) * 100}% - 8px)` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 px-1">
                        <span className="text-[9px] text-text-tertiary">CONSERVATIVE</span>
                        <span className="text-[9px] text-text-tertiary">AGGRESSIVE</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4 border-t border-border mt-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAutomationMode(isAutoTrading ? 'OFF' : 'AUTO')}
                    className={`
                        w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-bold font-heading tracking-widest transition-all duration-500 overflow-hidden relative
                        ${isAutoTrading
                            ? 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20'
                            : 'bg-accent text-white border border-accent/50 shadow-blue-glow hover:brightness-110'}
                    `}
                >
                    {isAutoTrading ? (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[ripple_2s_infinite]" />
                            <LuPause size={18} fill="currentColor" /> PAUSE SYSTEM MATRIX
                        </>
                    ) : (
                        <>
                            <LuPlay size={18} fill="currentColor" /> INITIATE AUTO-TRADE
                        </>
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={activateKillSwitch}
                    className="w-full py-3 bg-error/10 text-error border border-error/50 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-error/20 transition-colors"
                >
                    <LuPower size={14} /> Emergency Neural Cut
                </motion.button>
            </div>
        </div>
    );
}
