import { Request, Response, NextFunction } from 'express';

export class ChaosEngine {
    private static isChaosEnabled: boolean = process.env.CHAOS_MODE === 'true';

    /**
     * Middleware to simulate network faults and system instability
     * ONLY active if logic/CHAOS_MODE env var is true.
     */
    static middleware(req: Request, res: Response, next: NextFunction) {
        if (!ChaosEngine.isChaosEnabled) {
            next();
            return;
        }

        const rand = Math.random();

        // 1. Random Latency Injection (30% chance)
        // Simulate network lag between 500ms and 3000ms
        if (rand < 0.3) {
            const delay = Math.floor(Math.random() * 2500) + 500;
            console.warn(`[CHAOS] Injecting ${delay}ms latency`);
            setTimeout(next, delay);
            return;
        }

        // 2. Random 500 Errors (10% chance)
        // Simulate service crash or timeout
        if (rand > 0.3 && rand < 0.4) {
            console.error('[CHAOS] Simulating 500 Service Failure');
            res.status(500).json({
                error: 'INTERNAL_CHAOS_ERROR',
                message: 'Chaos Monkey struck the server.',
                details: 'Simulated infrastructure failure.'
            });
            return;
        }

        // 3. Random 429 Rate Limits (10% chance)
        if (rand > 0.4 && rand < 0.5) {
            console.warn('[CHAOS] Simulating 429 Rate Limit');
            res.status(429).json({
                error: 'TOO_MANY_REQUESTS',
                message: 'Chaos Monkey says you are too fast.'
            });
            return;
        }

        // 4. Data Corruption (Optional - implemented in data layer usually, not middleware)

        next();
    }
}
