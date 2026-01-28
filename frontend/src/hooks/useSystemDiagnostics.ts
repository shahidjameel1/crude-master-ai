import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useHeartbeat } from './useHeartbeat';

export const useSystemDiagnostics = () => {
    const {
        isAuthenticated,
        liveCandle,
        lastAgentAction,
        agentState,
        globalKillSwitch,
        updateDiagnostics,
        isMarketOpen,
        notifications
    } = useStore();

    const heartbeat = useHeartbeat();
    const lastUpdateRef = useRef<number>(Date.now());

    // Centralized Error Capture
    useEffect(() => {
        const handleError = (error: ErrorEvent | PromiseRejectionEvent) => {
            const message = 'reason' in error ? error.reason?.message : error.message;
            useStore.getState().pushNotification('ERROR', `SYSTEM_FAULT: ${message || 'Unknown Error'}`);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleError);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleError);
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const runDiagnostics = () => {
            const now = Date.now();

            // 1. Auth Health
            const storeState = useStore.getState();
            const isPaper = storeState.systemMode === 'PAPER';
            const authStatus = isAuthenticated ? 'OK' : (isPaper ? 'WARN' : 'FAIL');

            // 2. Market Data Health (Freshness)
            let marketStatus: 'OK' | 'STALE' | 'DOWN' = 'OK';
            if (!isMarketOpen) {
                marketStatus = 'OK'; // Market closed is expected
            } else if (!liveCandle) {
                marketStatus = 'DOWN';
            } else {
                const candleTime = Number(liveCandle.time) * 1000;
                const staleness = now - candleTime;
                if (staleness > 600000) { // 10 minutes for 15m candles is okay but > 10m is stale
                    marketStatus = 'STALE';
                }
                if (staleness > 1800000) { // 30 minutes is DOWN
                    marketStatus = 'DOWN';
                }
            }

            // 3. Agent Health
            let agentStatus: 'ACTIVE' | 'IDLE' | 'STALLED' = 'ACTIVE';
            if (agentState === 'IDLE') {
                agentStatus = 'IDLE';
            } else {
                const idleTime = now - lastAgentAction;
                if (idleTime > 300000) { // 5 minutes without action while searching/analyzing
                    agentStatus = 'STALLED';
                }
            }

            // 4. Execution Health
            const executionStatus = globalKillSwitch ? 'BLOCKED' : 'READY';

            // 5. UI Health
            const errorCount = notifications.filter(n => n.type === 'ERROR').length;
            const uiStatus = errorCount > 5 ? 'DEGRADED' : 'OK';

            // 6. Backend Health (Direct 3-state mapping)
            const backendHealthStatus = heartbeat.status;

            // Update Store
            updateDiagnostics({
                auth: authStatus as any,
                marketData: marketStatus as any,
                agent: agentStatus as any,
                execution: executionStatus as any,
                ui: uiStatus as any,
                backend: backendHealthStatus as any
            });

            lastUpdateRef.current = now;
        };

        const interval = setInterval(runDiagnostics, 10000); // 10s interval
        runDiagnostics();

        return () => clearInterval(interval);
    }, [
        isAuthenticated,
        liveCandle,
        lastAgentAction,
        agentState,
        globalKillSwitch,
        heartbeat.status,
        isMarketOpen,
        notifications,
        updateDiagnostics
    ]);

    return null;
};
