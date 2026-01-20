import { Trade } from '../hooks/usePaperTrading';

interface TradeControlsProps {
    currentPrice: number;
    position: Trade | null;
    onBuy: () => void;
    onSell: () => void;
    onClose: () => void;
    disabled?: boolean;
}

export function TradeControls({ currentPrice, position, onBuy, onSell, onClose, disabled = false }: TradeControlsProps) {
    // Live P&L Calc
    let livePnL = 0;
    if (position) {
        if (position.direction === 'LONG') {
            livePnL = currentPrice - position.entryPrice;
        } else {
            livePnL = position.entryPrice - currentPrice;
        }
    }

    const btnClass = (base: string) => `
        ${base} text-white font-bold py-2 px-6 rounded shadow-lg transition-all 
        active:scale-95 border backdrop-blur-sm
        ${disabled ? 'opacity-20 grayscale pointer-events-none' : 'hover:scale-105'}
    `;

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
            {!position ? (
                <>
                    <button
                        onClick={onBuy}
                        disabled={disabled}
                        className={btnClass("bg-green-500 hover:bg-green-600 border-green-400/30")}
                    >
                        BUY MKT
                    </button>
                    <button
                        onClick={onSell}
                        disabled={disabled}
                        className={btnClass("bg-red-500 hover:bg-red-600 border-red-400/30")}
                    >
                        SELL MKT
                    </button>
                    <div className="bg-black/40 backdrop-blur text-xs text-white/50 px-2 py-1 rounded border border-white/5">
                        PAPER TRADING MODE
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-4 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-xl animate-in slide-in-from-bottom-4">
                    <div className="flex flex-col px-2">
                        <span className={`text-xs font-bold ${position.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                            {position.direction}
                        </span>
                        <span className="text-[10px] text-white/50">@ {position.entryPrice}</span>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="flex flex-col px-2 min-w-[80px] text-center">
                        <span className="text-[10px] text-white/50 uppercase">P&L</span>
                        <span className={`text-lg font-mono font-bold ${livePnL >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                            {livePnL >= 0 ? '+' : ''}{livePnL.toFixed(0)}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="ml-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-4 rounded border border-white/20 transition-colors"
                    >
                        CLOSE
                    </button>
                </div>
            )}
        </div>
    );
}
