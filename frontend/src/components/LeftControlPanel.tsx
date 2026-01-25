import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { Layers, Target, Info, TrendingUp, Plus } from 'lucide-react';
import { RiskCalculator } from './RiskCalculator';
import { AutomationDashboard } from './AutomationDashboard';
import { useAutomationEngine } from '../hooks/useAutomationEngine';
import { usePaperTrading } from '../hooks/usePaperTrading';
import { ReasoningTimeline } from './ReasoningTimeline';
import { ConfidenceMeter } from './ConfidenceMeter';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function LeftControlPanel() {
    const {
        strategies,
        toggleStrategy,
        updateStrategyWeight,
        confluenceScore,
        currentPrice,
        activeView,
        defaultTrade,
        pointsToday,
        targetPoints,
        stopLossPoints,
        accountSize,
        riskPerTrade,
        contracts,
        tradeHistory,
        setUI
    } = useStore();

    const paperTrading = usePaperTrading();
    const contract = contracts.find(c => c.symbol === defaultTrade) || contracts[0];

    const {
        mode,
        setMode,
        prerequisites,
        globalKillSwitch: triggerLocalKill,
    } = useAutomationEngine(
        tradeHistory as any,
        // Passing actual market state
        { trend: currentPrice > 0 ? (currentPrice > 0 ? 'UP' : 'DOWN') : 'SIDEWAYS', confluenceScore, isKillZone: false, riskStatus: 'SAFE' } as any,
        currentPrice,
        paperTrading,
        activeView,
        defaultTrade,
        pointsToday,
        targetPoints,
        stopLossPoints,
        accountSize,
        riskPerTrade,
        contract.multiplier
    );

    return (
        <div className="w-80 h-full flex-shrink-0 flex flex-col gap-4 p-4 bg-black/40 border-r border-white/5 overflow-y-auto custom-scrollbar overflow-x-hidden">

            {/* Confidence Meter (High Priority) */}
            <ConfidenceMeter />

            {/* Strategy Stack */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1 mb-1">
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-accent" />
                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Strategy Stack</h2>
                    </div>
                    <button
                        onClick={() => setUI({ isStrategyCreatorOpen: true })}
                        className="p-1 hover:bg-white/10 rounded transition-all group"
                        title="Create New Strategy"
                    >
                        <Plus size={14} className="text-white/40 group-hover:text-accent" />
                    </button>
                </div>
                {strategies.map((s) => (
                    <StrategyCard
                        key={s.id}
                        strategy={s}
                        onToggle={() => toggleStrategy(s.id)}
                        onWeightChange={(val) => updateStrategyWeight(s.id, val)}
                    />
                ))}
            </div>

            {/* Reasoning Timeline (Transparency) */}
            <div className="flex-1 min-h-[200px] flex flex-col">
                <ReasoningTimeline />
            </div>

            {/* Position Sizing Hub */}
            <RiskCalculator />

            {/* Automation Intelligence Hub */}
            <div className="flex-1 min-h-0 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                <AutomationDashboard
                    mode={mode as any}
                    onModeChange={setMode as any}
                    prerequisites={prerequisites}
                    onKillSwitch={triggerLocalKill}
                />
            </div>
        </div>
    );
}

function StrategyCard({ strategy, onToggle, onWeightChange }: {
    strategy: any,
    onToggle: () => void,
    onWeightChange: (val: number) => void
}) {
    const cardRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
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
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={`p-3 rounded-xl border transition-all relative overflow-hidden ${strategy.enabled
                    ? 'bg-accent/5 border-accent/20 cursor-pointer'
                    : 'bg-white/2 border-white/5 opacity-40 grayscale'
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w - 1.5 h - 1.5 rounded - full ${strategy.enabled ? 'bg-accent animate-pulse' : 'bg-white/20'} `} />
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">{strategy.name}</span>
                </div>
                <input
                    type="checkbox" checked={strategy.enabled} onChange={onToggle}
                    className="w-3 h-3 accent-accent cursor-pointer"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-widest">
                    <span>Confidence Weight</span>
                    <span className="text-white/60">{strategy.weight}</span>
                </div>
                <input
                    type="range" min="0" max="50" step="5" value={strategy.weight}
                    onChange={(e) => onWeightChange(parseInt(e.target.value))}
                    disabled={!strategy.enabled}
                    className="w-full h-0.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent disabled:cursor-not-allowed"
                />
            </div>

            <div className="absolute top-0 right-0 p-2 opacity-10 blur-[1px]">
                <Target size={48} className="text-white" />
            </div>
        </motion.div>
    );
}

