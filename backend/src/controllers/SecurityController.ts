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

// Simple in-memory storage for this session
// In production, this might sync with a database (SystemState table)
// Load initial state from persistent service
let currentMode: OperationalMode = systemState.getState().globalKillSwitch
    ? OperationalMode.EMERGENCY_LOCK
    : OperationalMode.NORMAL;

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
    static isTradingAllowed(): { allowed: boolean; reason?: string } {
        if (currentMode === OperationalMode.GLASS) {
            return { allowed: false, reason: 'System is in GLASS MODE (Read-Only)' };
        }
        if (currentMode === OperationalMode.EMERGENCY_LOCK) {
            return { allowed: false, reason: 'System is in EMERGENCY LOCK' };
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
        currentMode = OperationalMode.EMERGENCY_LOCK;
        systemState.updateState({ globalKillSwitch: true, automationMode: 'OFF' });

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
     * Returns health status of the system
     */
    static async heartbeat(req: Request, res: Response) {
        const metrics = HealthService.getMetrics();
        const connections = await HealthService.checkConnectivity();

        const heartbeat: Heartbeat = {
            timestamp: metrics.timestamp,
            status: (currentMode === OperationalMode.EMERGENCY_LOCK || !connections.broker) ? 'DOWN' : 'OK',
            latencyMs: metrics.latencyMs,
            services: connections
        };

        res.json(heartbeat);
    }

    /**
     * Endpoint: Reset System (Owner Only)
     */
    static resetSystem(req: Request, res: Response) {
        currentMode = OperationalMode.NORMAL;
        systemState.updateState({ globalKillSwitch: false });
        console.log('✅ System Reset to NORMAL mode');
        res.json({ mode: currentMode });
    }
}
