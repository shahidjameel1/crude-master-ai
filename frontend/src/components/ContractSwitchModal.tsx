import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, BadgeCheck, X } from 'lucide-react';
import { ContractSymbol } from '../store/useStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    targetContract: ContractSymbol;
    currentContract: ContractSymbol;
}

export function ContractSwitchModal({ isOpen, onClose, targetContract, currentContract }: Props) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-lg bg-[#0A0E1A] border border-red-500/30 rounded-3xl shadow-red-glow overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-red-500/5">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Security Alert: Default Protocol Switch</h2>
                            <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">High Risk Elevation Detected</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-[8px] text-white/20 uppercase font-black">Current Default</span>
                                <div className="text-sm font-bold text-white mt-1">{currentContract}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                                <span className="text-[8px] text-red-500/40 uppercase font-black">Target Default</span>
                                <div className="text-sm font-bold text-red-500 mt-1">{targetContract}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-white/60 leading-relaxed">
                                    <strong className="text-white">Margin Impact:</strong> Switching from MINI to BIG contract increases margin requirement by 10x.
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-white/60 leading-relaxed">
                                    <strong className="text-white">Agent Execution:</strong> The AI Agent will now place orders using the high-risk BIG contract.
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <BadgeCheck size={16} className="text-accent shrink-0 mt-0.5" />
                                <div className="text-[11px] text-white/60 leading-relaxed">
                                    <strong className="text-white">Mandatory Verification:</strong> You are authorizing the system to engage in full-lot size execution.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-black flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs rounded-xl transition-all border border-white/10"
                        >
                            Abort Switch
                        </button>
                        <button
                            onClick={() => {
                                // Logic handled in TopBar via setContract
                                onClose();
                            }}
                            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs rounded-xl shadow-red-glow transition-all"
                        >
                            Authorize & Switch
                        </button>
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
