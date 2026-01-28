import { Request, Response } from 'express';
import { OperationalMode, Heartbeat } from '../types';
import { HealthService } from '../services/HealthService';
import { OrderService } from '../services/OrderService';
import { systemState } from '../services/SystemStateService';

// To be injected from server.ts
let orderService: OrderService | null = null;

export function setOrderService(service: OrderService) {
    orderService = service;
}

// In-memory session state (Non-persistent, cleared on restart)
const sessionKillSwitches = new Map<string, boolean>();
let currentMode: OperationalMode = OperationalMode.NORMAL;

export class SecurityController {
    /**
     * Get the current operational mode
     */
    static getMode(): OperationalMode {
        return currentMode;
    }

    /**
     * Check if trading is allowed based on current mode
     */
    static isTradingAllowed(req: Request): { allowed: boolean; reason?: string } {
        const sessionId = (req as any).user?.sessionId;
        const isKilled = sessionId ? sessionKillSwitches.get(sessionId) : false;

        if (isKilled || currentMode === OperationalMode.EMERGENCY_LOCK) {
            return { allowed: false, reason: 'System is LOCKED by Kill Switch' };
        }
        if (currentMode === OperationalMode.GLASS) {
            return { allowed: false, reason: 'System is in GLASS MODE (Read-Only)' };
        }
        return { allowed: true };
    }

    /**
     * Endpoint: Toggle Glass Mode (Read-only)
     */
    static toggleGlassMode(req: Request, res: Response) {
        const { enabled } = req.body;

        if (currentMode === OperationalMode.EMERGENCY_LOCK) {
            res.status(403).json({ error: 'Cannot toggle Glass Mode while in Emergency Lock' });
            return;
        }

        currentMode = enabled ? OperationalMode.GLASS : OperationalMode.NORMAL;
        console.log(`🛡️ Operational Mode changed to: ${currentMode}`);

        res.json({ mode: currentMode });
    }

    /**
     * Endpoint: Emergency Kill Switch
     * Stops all trading immediately and locks the system.
     */
    static async emergencyKill(req: Request, res: Response) {
        const sessionId = (req as any).user?.sessionId;
        if (sessionId) sessionKillSwitches.set(sessionId, true);

        currentMode = OperationalMode.EMERGENCY_LOCK;
        systemState.updateState({ automationMode: 'OFF' });

        console.log('🚨 EMERGENCY KILL SWITCH ACTIVATED');

        let squareOffData = { total: 0, squared: 0 };
        if (orderService) {
            squareOffData = await orderService.squareOffAll();
        }

        res.json({
            mode: currentMode,
            status: 'STOPPED',
            message: 'System locked. All operations halted.',
            squareOff: squareOffData
        });
    }

    /**
     * Endpoint: System Heartbeat
     * Returns health status of the system (HEALTHY, DEGRADED, UNSAFE)
     */
    static async heartbeat(req: Request, res: Response) {
        const metrics = HealthService.getMetrics();
        const connections = await HealthService.checkConnectivity();

        // Compute 3-state health logic
        let healthState: 'HEALTHY' | 'DEGRADED' | 'UNSAFE' = 'HEALTHY';

        if (currentMode === OperationalMode.EMERGENCY_LOCK) {
            healthState = 'UNSAFE';
        } else if (!connections.broker || !connections.feed) {
            healthState = 'DEGRADED';
        }

        const heartbeat = {
            timestamp: metrics.timestamp,
            status: healthState,
            latencyMs: metrics.latencyMs,
            services: {
                ...connections,
                operationalMode: currentMode
            }
        };

        res.json(heartbeat);
    }

    /**
     * Endpoint: Reset System (Owner Only)
     */
    static resetSystem(req: Request, res: Response) {
        const sessionId = (req as any).user?.sessionId;
        if (sessionId) sessionKillSwitches.set(sessionId, false);
        currentMode = OperationalMode.NORMAL;
        console.log('✅ System Reset to NORMAL mode');
        res.json({ mode: currentMode });
    }
}
