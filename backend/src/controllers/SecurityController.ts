import { Request, Response } from 'express';
import { OperationalMode, Heartbeat } from '../types';

// Simple in-memory storage for this session
// In production, this might sync with a database (SystemState table)
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
    static emergencyKill(req: Request, res: Response) {
        currentMode = OperationalMode.EMERGENCY_LOCK;
        console.log('🚨 EMERGENCY KILL SWITCH ACTIVATED');

        // TODO: In a real integration, this would:
        // 1. Call Broker API to Cancel All Orders
        // 2. Call Broker API to Square Off All Positions
        // 3. Persist state to DB

        res.json({
            mode: currentMode,
            status: 'STOPPED',
            message: 'System locked. All operations halted.'
        });
    }

    /**
     * Endpoint: System Heartbeat
     * Returns health status of the system
     */
    static heartbeat(req: Request, res: Response) {
        const heartbeat: Heartbeat = {
            timestamp: new Date(),
            status: currentMode === OperationalMode.EMERGENCY_LOCK ? 'DOWN' : 'OK',
            latencyMs: Math.floor(Math.random() * 20) + 10, // Mock latency
            services: {
                database: true, // Mock status
                broker: true,   // Mock status
                feed: true      // Mock status
            }
        };

        res.json(heartbeat);
    }

    /**
     * Endpoint: Reset System (Requires strict auth in prod)
     */
    static resetSystem(req: Request, res: Response) {
        // Simple unlock for demo purposes
        currentMode = OperationalMode.NORMAL;
        console.log('✅ System Reset to NORMAL mode');
        res.json({ mode: currentMode });
    }
}
