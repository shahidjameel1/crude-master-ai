import { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { LeftControlPanel } from './components/LeftControlPanel';
import { ExecutionBottomBar } from './components/ExecutionBottomBar';
import { ContinuousChart } from './components/ContinuousChart';
import { Background3D } from './components/Background3D';
import { PLDashboard } from './components/PLDashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { TradeJournal } from './components/TradeJournal';
import { StrategyCreatorWizard } from './components/StrategyCreatorWizard';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { NotificationToast } from './components/NotificationToast';
import { AdminPanel } from './components/AdminPanel';
import { EconomicCalendar } from './components/EconomicCalendar';
import { useStore } from './store/useStore';
import { usePaperTrading } from './hooks/usePaperTrading';

function App() {
    const {
        is3DMode,
        activeTab,
        setUI,
        globalKillSwitch,
        triggerKillSwitch,
        isStrategyCreatorOpen
    } = useStore();

    const paperTrading = usePaperTrading();

    // Key Handler: Kill Switch (ESC)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !globalKillSwitch) {
                triggerKillSwitch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [globalKillSwitch, triggerKillSwitch]);

    return (
        <div className="flex flex-col h-screen w-screen bg-[#02050A] text-white overflow-hidden font-sans select-none">
            {/* 3D Environmental Background */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <Background3D />
            </div>

            {/* Top Bar - Command Center */}
            <TopBar />

            <div className="flex flex-1 min-h-0 relative z-10">

                {/* Left Panel - Control & Strategy */}
                <LeftControlPanel />

                {/* Main Workspace - Chart + Tabs */}
                <main className="flex-1 flex flex-col min-w-0 bg-black/20">

                    <div className="flex-1 relative">
                        <div style={{ display: activeTab === 'REVIEW' ? 'block' : 'none', height: '100%' }}>
                            <ContinuousChart
                                paperTrading={paperTrading}
                            />
                        </div>
                        {activeTab === 'JOURNAL' && (
                            <div className="p-8 h-full overflow-y-auto">
                                <h2 className="text-xl font-bold mb-4">Trade Journal & Evolution</h2>
                                <TradeJournal trades={paperTrading.tradeHistory} />
                            </div>
                        )}
                        {activeTab === 'PERFORMANCE' && (
                            <div className="p-8 h-full overflow-y-auto">
                                <PerformanceDashboard />
                            </div>
                        )}
                        {activeTab === 'CALENDAR' && (
                            <div className="p-8 h-full overflow-y-auto">
                                <EconomicCalendar />
                            </div>
                        )}
                    </div>

                    {/* Bottom Status Ticker */}
                    <div className="h-8 flex items-center px-4 bg-black/60 border-t border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-white/30 uppercase font-bold">Latency</span>
                                <span className="text-[9px] font-mono text-accent">14ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-white/30 uppercase font-bold">Protocol</span>
                                <span className="text-[9px] font-mono text-white/60">GMD_V4.2</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-white/30 uppercase font-bold">Risk Status</span>
                                <span className="text-[9px] font-mono text-green-500 uppercase">Gated</span>
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-4">
                            <button
                                onClick={() => setUI({ is3DMode: !is3DMode })}
                                className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${is3DMode ? 'bg-accent text-white border-accent' : 'text-white/20 border-white/10 hover:border-white/20'}`}
                            >
                                {is3DMode ? '3D Active' : '3D Dormant'}
                            </button>
                            <PLDashboard tradeHistory={paperTrading.tradeHistory} />
                        </div>
                    </div>
                </main>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-2xl z-50">
                    {['REVIEW', 'JOURNAL', 'PERFORMANCE', 'CALENDAR'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setUI({ activeTab: tab as any })}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === tab
                                ? 'bg-accent text-white shadow-blue-glow'
                                : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Bar - Execution & Logs */}
            <ExecutionBottomBar />

            {/* Strategy Creator Wizard */}
            <StrategyCreatorWizard
                isOpen={isStrategyCreatorOpen}
                onClose={() => setUI({ isStrategyCreatorOpen: false })}
            />

            {/* Order Confirmation Firewall */}
            <OrderConfirmationModal />

            {/* Global Notifications */}
            <NotificationToast />

            {/* Admin Interface */}
            <AdminPanel />

            {/* Global Kill Switch Overlay */}
            {globalKillSwitch && (
                <div className="fixed inset-0 z-[1000] bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                    <div className="flex flex-col items-center gap-4 p-12 bg-black rounded-3xl border-2 border-red-500 shadow-red-glow max-w-lg text-center">
                        <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse">
                            <span className="text-4xl">🛑</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Terminated</h2>
                        <p className="text-red-500/80 font-mono text-sm uppercase tracking-widest">
                            Global Kill Switch has been activated.<br />
                            All automation has been physically severed.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-8 py-3 bg-red-500 text-white font-black uppercase text-xs rounded-xl hover:bg-red-600 transition-all active:scale-95"
                        >
                            Emergency Restart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
