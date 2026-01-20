import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function RiskCalculator() {
    const { accountSize, riskPerTrade, activeView, contracts } = useStore();
    const [slDistance, setSlDistance] = useState<number>(10); // Points
    const [lotSize, setLotSize] = useState<number>(0);
    const [riskAmount, setRiskAmount] = useState<number>(0);

    const activeContract = contracts.find(c => c.symbol === activeView) || contracts[0];

    useEffect(() => {
        const riskVal = (accountSize * riskPerTrade) / 100;
        setRiskAmount(riskVal);

        // Dynamic multiplier based on contract type
        const pointValue = activeContract.multiplier;
        if (slDistance > 0) {
            const calculatedLots = riskVal / (slDistance * pointValue);
            setLotSize(Number(calculatedLots.toFixed(2)));
        }
    }, [accountSize, riskPerTrade, slDistance, activeContract]);

    return (
        <div className="p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Risk Engine: Position Calculator</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase font-bold">Account Size</label>
                    <div className="text-sm font-mono text-white">₹{(accountSize).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase font-bold">Risk Per Trade</label>
                    <div className="text-sm font-mono text-white">{riskPerTrade}% (₹{riskAmount.toLocaleString()})</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] text-white/40 uppercase font-bold">Stop Loss Distance (Points)</label>
                        <span className="text-xs font-mono text-accent">{slDistance} pts</span>
                    </div>
                    <input
                        type="range"
                        min="2"
                        max="100"
                        step="1"
                        value={slDistance}
                        onChange={(e) => setSlDistance(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                        <div className="text-[9px] text-white/40 uppercase font-bold">Recommended Size</div>
                        <div className="text-xl font-black text-white font-mono">{lotSize} <span className="text-[10px] text-white/40">LOTS</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-white/40 uppercase font-bold">Potential RR (2:1)</div>
                        <div className="text-sm font-black text-green-400 font-mono">+₹{(riskAmount * 2).toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex gap-2 text-[10px] text-white/40 italic">
                    <span>* Calculation based on {activeContract.name} (1pt = ₹{activeContract.multiplier})</span>
                </div>
            </div>
        </div>
    );
}
