import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface Opportunity {
    direction: 'LONG' | 'SHORT';
    score: number;
    reason: string;
    missingConditions: string[];
}

interface AnalysisResult {
    signal: any | null; // Replace with proper type
    shouldTrade: boolean;
    explanation: string;
    opportunities: Opportunity[];
}

interface AgentExplanationProps {
    analysis: AnalysisResult | null;
}

export const AgentExplanation: React.FC<AgentExplanationProps> = ({ analysis }) => {
    if (!analysis) return (
        <div className="p-4 rounded-lg bg-black/20 border border-white/5 flex items-center gap-3 animate-pulse">
            <Info className="text-gray-500" size={18} />
            <span className="text-xs text-gray-500 font-mono">NEURAL ENGINE ANALYZING...</span>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Main Explanation Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    p-4 rounded-lg border backdrop-blur-sm
                    ${analysis.shouldTrade
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-warning/5 border-warning/20 text-warning'}
                `}
            >
                <div className="flex items-start gap-3">
                    {analysis.shouldTrade ? <CheckCircle size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                    <div>
                        <h4 className="text-sm font-bold font-orbitron tracking-wide mb-1">
                            {analysis.shouldTrade ? 'EXECUTION PROTOCOL ACTIVE' : 'NO EXECUTION TRIGGER'}
                        </h4>
                        <p className="text-xs font-mono opacity-80 leading-relaxed">
                            {analysis.explanation || "Detailed analysis parameters pending..."}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Opportunity Rankings */}
            <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-heading pl-1">
                    Potential Vectors
                </h5>

                {analysis.opportunities.map((opp, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {opp.direction === 'LONG'
                                    ? <TrendingUp size={14} className="text-success" />
                                    : <TrendingDown size={14} className="text-error" />}
                                <span className={`text-xs font-bold ${opp.direction === 'LONG' ? 'text-success' : 'text-error'}`}>
                                    {opp.direction}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-16 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${opp.score > 70 ? 'bg-cyan-400' : 'bg-gray-500'}`}
                                        style={{ width: `${opp.score}%` }}
                                    />
                                </div>
                                <span className="text-xs font-mono text-cyan-400">{opp.score}%</span>
                            </div>
                        </div>

                        {opp.missingConditions.length > 0 && (
                            <div className="text-[10px] text-gray-400 pl-6 border-l border-gray-700 ml-1">
                                <div className="text-gray-500 mb-0.5">Missing:</div>
                                {opp.missingConditions.map((cond, i) => (
                                    <div key={i} className="text-error/80">• {cond}</div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
