import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Plus, Terminal, Play, Info, AlertTriangle } from 'lucide-react';

export function StrategyCreatorWizard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [rules, setRules] = useState<string[]>([]);

    // Zustand
    const { addLog } = useStore();

    const handleSave = () => {
        addLog(`STRATEGY_ENGINE: New strategy '${name}' created and saved as DRAFT.`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative w-full max-w-2xl bg-black border border-white/10 rounded-3xl shadow-blue-glow overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                            <Wand2 size={24} className="text-accent" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Strategy Creator</h2>
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Advanced Rule-Based Wizard</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
                        <X size={20} className="text-white/40 hover:text-white" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/5 flex">
                    <div className={`h-full bg-accent transition-all duration-500`} style={{ width: `${(step / 3) * 100}%` }} />
                </div>

                {/* Body */}
                <div className="p-8 min-h-[400px]">
                    {step === 1 && (
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-white/30 uppercase font-black tracking-widest">Protocol Name</label>
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Mean Reversion Alpha"
                                    className="bg-white/5 border border-white/10 p-4 rounded-xl text-white font-heading focus:border-accent outline-none transition-all placeholder:text-white/10"
                                />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-start gap-4">
                                <Info size={16} className="text-accent shrink-0 mt-1" />
                                <p className="text-xs text-white/60 leading-relaxed font-heading">
                                    Define a clear, descriptive name. This protocol will be subject to all institutional safety laws upon activation.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-6">
                            <label className="text-[10px] text-white/30 uppercase font-black tracking-widest">Logic Components</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['VWAP Cross', 'EMA Flow', 'RSI Oversold', 'Premium Zone', 'Fair Value Gap', 'Order Block'].map((comp) => (
                                    <button
                                        key={comp}
                                        onClick={() => setRules(prev => prev.includes(comp) ? prev.filter(r => r !== comp) : [...prev, comp])}
                                        className={`p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all text-left flex items-center justify-between ${rules.includes(comp) ? 'bg-accent/20 border-accent text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                            }`}
                                    >
                                        {comp}
                                        {rules.includes(comp) && <Plus size={14} className="rotate-45" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-6">
                            <div className="h-48 bg-black border border-white/10 rounded-2xl p-4 font-mono text-[11px] overflow-hidden relative">
                                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                                    <Terminal size={14} className="text-green-500" />
                                    <span className="text-white/40 uppercase">Backtest Engine Sim_V1.p</span>
                                </div>
                                <div className="flex flex-col gap-1 text-green-500/80">
                                    <p>&gt; Initializing protocol: {name || 'UNNAMED'}</p>
                                    <p>&gt; Loading rules: [{rules.join(', ') || 'NONE'}]</p>
                                    <p>&gt; Analyzing last 200 sessions...</p>
                                    <p>&gt; <span className="text-white">Win Rate: 58.42%</span></p>
                                    <p>&gt; <span className="text-white">Profit Factor: 1.42</span></p>
                                    <p>&gt; <span className="text-red-500">Max DD: 12.5% (Warning: Out of bounds)</span></p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-4">
                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-tight">
                                    AI Warning: High Max Drawdown detected. Consider adding a volatility filter before publishing.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-8 py-6 border-t border-white/5 bg-white/2">
                    <button
                        onClick={() => step > 1 && setStep(step - 1)}
                        className={`text-xs font-black uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0 cursor-default' : 'text-white/40 hover:text-white'}`}
                    >
                        Previous
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white"
                        >
                            Cancel
                        </button>
                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="flex items-center gap-2 px-8 py-2 bg-accent text-white rounded-xl font-black uppercase text-xs shadow-blue-glow hover:bg-accent/80 transition-all active:scale-95"
                            >
                                Continue
                                <Play size={14} fill="white" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-8 py-2 bg-green-500 text-white rounded-xl font-black uppercase text-xs shadow-green-glow hover:bg-green-600 transition-all active:scale-95"
                            >
                                Save Draft Strategy
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
