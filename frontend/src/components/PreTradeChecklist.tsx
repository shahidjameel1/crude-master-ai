import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const checklistItems = [
    { id: 'mindset', label: 'Mindset Check: Am I calm and focused?', required: true },
    { id: 'news', label: 'News Check: Any high-impact events soon?', required: true },
    { id: 'levels', label: 'Levels Check: Are daily support/resistance marked?', required: true },
    { id: 'plan', label: 'Plan Check: Do I know my max loss today?', required: true },
    { id: 'distractions', label: 'Environment: Are phone/distractions away?', required: true }
];

interface PreTradeChecklistProps {
    onComplete: () => void;
    isOpen: boolean;
}

export const PreTradeChecklist: React.FC<PreTradeChecklistProps> = ({ onComplete, isOpen }) => {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        const newSet = new Set(checkedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setCheckedItems(newSet);
    };

    const allChecked = checklistItems.every(item => item.required ? checkedItems.has(item.id) : true);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md p-6 bg-[#0B0E11] border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)]"
                >
                    <h2 className="text-xl font-orbitron font-bold text-cyan-400 mb-4 tracking-wider flex items-center gap-2">
                        <span className="text-2xl">🛡️</span> PRE-FLIGHT CHECK
                    </h2>

                    <div className="space-y-3 mb-6">
                        {checklistItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`
                                    p-4 rounded-lg cursor-pointer border transition-all duration-200 flex items-center gap-3
                                    ${checkedItems.has(item.id)
                                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}
                                `}
                            >
                                <div className={`
                                    w-6 h-6 rounded border flex items-center justify-center transition-colors
                                    ${checkedItems.has(item.id) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500'}
                                `}>
                                    {checkedItems.has(item.id) && <span>✓</span>}
                                </div>
                                <span className="font-roboto text-sm">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onComplete}
                        disabled={!allChecked}
                        className={`
                            w-full py-4 rounded-lg font-bold tracking-widest transition-all duration-300
                            ${allChecked
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-[1.02]'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {allChecked ? 'INITIATE TRADING SYSTEMS' : 'COMPLETE CHECKLIST'}
                    </button>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};
