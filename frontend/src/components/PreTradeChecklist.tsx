import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { LuShield, LuInfo, LuTriangleAlert, LuLock } from "react-icons/lu";

export function PreTradeChecklist() {
    const {
        isMarketOpen,
        globalKillSwitch,
        agentState,
        confluenceScore,
        currentPrice,
        defaultTrade,
        updateChecklistStatus,
        checklistStatus
    } = useStore();

    useEffect(() => {
        const failed = [];
        if (!isMarketOpen) failed.push("Market Closed");
        if (globalKillSwitch) failed.push("Global Kill Switch Active");
        if (agentState === 'IDLE') failed.push("Agent Idle");
        if (confluenceScore < 50) failed.push("Low Confidence (<50%)");
        if (!currentPrice || currentPrice <= 0) failed.push("Invalid Price Feed");
        if (!defaultTrade) failed.push("No Contract Selected");

        const passed = failed.length === 0;

        // Only update if changed to prevent loops
        if (passed !== checklistStatus.passed || failed.length !== checklistStatus.failedItems.length) {
            updateChecklistStatus(passed, failed);
        }
    }, [isMarketOpen, globalKillSwitch, agentState, confluenceScore, currentPrice, defaultTrade, updateChecklistStatus, checklistStatus.passed, checklistStatus.failedItems.length]);

    if (checklistStatus.passed) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <LuShield size={14} className="text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">System Armed</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 group relative cursor-help">
            <LuLock size={14} className="text-red-500" />
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Execution Locked</span>
            </div>

            {/* Tooltip for Failed Items */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/95 backdrop-blur-xl border border-red-500/20 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="flex items-center gap-2 mb-2 p-1 border-b border-red-500/10">
                    <LuInfo size={12} className="text-red-500" />
                    <span className="text-[9px] font-black uppercase text-red-500">Safety Interlocks</span>
                </div>
                <div className="space-y-1">
                    {checklistStatus.failedItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <LuTriangleAlert size={10} className="text-red-400" />
                            <span className="text-[9px] font-medium text-white/80">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
