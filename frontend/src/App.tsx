import { useEffect } from 'react';
import { GlobalCommandBar } from './components/GlobalCommandBar';
import { MarketStatusStrip } from './components/MarketStatusStrip';
import { LeftControlPanel } from './components/LeftControlPanel';
import { ExecutionBottomBar } from './components/ExecutionBottomBar';
import { ContinuousChart } from './components/ContinuousChart';
import { Background3D } from './components/Background3D';
import { TradeJournal } from './components/TradeJournal';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { StrategyCreatorWizard } from './components/StrategyCreatorWizard';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { NotificationToast } from './components/NotificationToast';
import { AdminPanel } from './components/AdminPanel';
import { EconomicCalendar } from './components/EconomicCalendar';
import { useStore } from './store/useStore';
import { usePaperTrading } from './hooks/usePaperTrading';
import { useDevice } from './hooks/useDevice';
import { usePanicGesture } from './hooks/usePanicGesture';
import { useConfidenceDecay } from './hooks/useConfidenceDecay';
import { useStrategyEvolution } from './hooks/useStrategyEvolution';
import { useRegimeDetection } from './hooks/useRegimeDetection';
import { useSessionProfile } from './hooks/useSessionProfile';
import { AuthOverlay } from './components/AuthOverlay';
import { NotificationDrawer } from './components/NotificationDrawer';
import { useSystemDiagnostics } from './hooks/useSystemDiagnostics';
import { QAPanel } from './components/QAPanel';

import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const {
        activeTab,
        setUI,
        globalKillSwitch,
        triggerKillSwitch,
        isStrategyCreatorOpen,
        isAuthenticated,
        isAuthLoading,
        setAuthenticated,
        setAuthLoading,
        isDrawerOpen,
        fetchSystemStatus
    } = useStore();

    const paperTrading = usePaperTrading();
    const device = useDevice();
    usePanicGesture(); // Activates global 3-tap kill switch
    useConfidenceDecay(); // Activates confidence decay engine
    useStrategyEvolution(); // Activates strategy evolution
    useRegimeDetection(); // Activates regime detection
    useSessionProfile(); // Activates session-specific behavior
    useSystemDiagnostics(); // Activates self-diagnostic engine

    // Synchronize device state with store
    useEffect(() => {
        setUI({
            deviceType: device.deviceType,
            orientation: device.orientation
        });
    }, [device.deviceType, device.orientation, setUI]);

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

    // Zero silent auto-login. App must always start at verification terminal.
    useEffect(() => {
        setAuthLoading(false);
    }, [setAuthLoading]);

    // Fetch System Status (Mode/Health)
    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 30000); // Pulse every 30s
        return () => clearInterval(interval);
    }, [fetchSystemStatus]);

    // Global 401 Interceptor
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

            if (response.status === 401 && !url.includes('/api/auth/login')) {
                setAuthenticated(false);
            }
            return response;
        };
        return () => { window.fetch = originalFetch; };
    }, [setAuthenticated]);

    if (isAuthLoading) {
        return (
            <div className="h-screen w-screen bg-[#02050A] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <div className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">Initialising Friday-X...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthOverlay />;
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-[#02050A] text-white overflow-hidden font-sans select-none">
            {/* 3D Environmental Background */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <Background3D />
            </div>

            {/* Top Bar - Command Center */}
            <GlobalCommandBar />

            {/* Secondary Status Strip (Sticky) */}
            <div className="pt-10 z-[80]"> {/* Pt-10 to account for fixed GlobalCommandBar */}
                <MarketStatusStrip />
            </div>

            {/* Command Center Layout - Reactive to Device/Orientation */}
            <div className={`flex flex-1 min-h-0 relative z-10 w-full ${device.isMobile && device.isPortrait ? 'flex-col' : 'flex-row'
                }`}>

                {/* Left Panel - Control & Strategy (Desktop) */}
                <div className="hidden lg:block h-full z-20 relative">
                    <LeftControlPanel />
                </div>

                {/* Mobile/Tablet Drawer */}
                <AnimatePresence>
                    {isDrawerOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setUI({ isDrawerOpen: false })}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 w-80 z-[160] bg-black lg:hidden overflow-y-auto"
                            >
                                <LeftControlPanel />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Workspace - Chart + Tabs */}
                <main className="flex-1 flex flex-col min-w-0 bg-black/20 w-full relative">
                    <div className="flex-1 relative overflow-hidden">
                        <div style={{ display: activeTab === 'REVIEW' ? 'block' : 'none', height: '100%' }}>
                            <ContinuousChart paperTrading={paperTrading} />
                        </div>
                        {activeTab === 'JOURNAL' && (
                            <div className="p-8 h-full overflow-y-auto">
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
                </main>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-2xl z-50">
                    {['REVIEW', 'JOURNAL', 'PERFORMANCE', 'CALENDAR'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setUI({ activeTab: tab as any })}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === tab
                                ? 'bg-accent text-white shadow-blue-glow'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Bar - Execution & Logs */}
            <ExecutionBottomBar />

            {/* Pop-up Modals & Overlays */}
            <StrategyCreatorWizard
                isOpen={isStrategyCreatorOpen}
                onClose={() => setUI({ isStrategyCreatorOpen: false })}
            />
            <OrderConfirmationModal />
            <NotificationToast />
            <NotificationDrawer />
            <AdminPanel />
            <QAPanel />

            {/* Global Kill Switch Overlay */}
            {globalKillSwitch && (
                <div className="fixed inset-0 z-[1000] bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4 p-12 bg-black rounded-3xl border-2 border-red-500 shadow-red-glow max-w-lg text-center">
                        <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse">
                            <span className="text-4xl text-white">🛑</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Terminated</h2>
                        <p className="text-red-500/80 font-mono text-sm uppercase tracking-widest">
                            Global Kill Switch has been activated.<br />
                            All automation has been physically severed.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
