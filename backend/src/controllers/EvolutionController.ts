import { Request, Response } from 'express';

// In-memory storage (Android-compatible, no Prisma)
const evolutionLogs: any[] = [];
const sessionRatings: any[] = [];
let regimeState: any = { isNoTradeMode: false, reason: '', detectedAt: null };

export class EvolutionController {
    // Get evolution logs
    static async getEvolutionLogs(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Filter by userId and return last 100
            const userLogs = evolutionLogs
                .filter(log => log.userId === userId)
                .slice(-100)
                .reverse();

            res.json(userLogs);
        } catch (error) {
            console.error('Error fetching evolution logs:', error);
            res.status(500).json({ error: 'Failed to fetch evolution logs' });
        }
    }

    // Add evolution log
    static async addEvolutionLog(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { confirmation, oldWeight, newWeight, reason, sampleSize } = req.body;

            const log = {
                id: Date.now().toString(),
                userId,
                confirmation,
                oldWeight,
                newWeight,
                reason,
                sampleSize,
                timestamp: new Date()
            };

            evolutionLogs.push(log);

            // Keep only last 1000 logs in memory
            if (evolutionLogs.length > 1000) {
                evolutionLogs.shift();
            }

            res.json(log);
        } catch (error) {
            console.error('Error adding evolution log:', error);
            res.status(500).json({ error: 'Failed to add evolution log' });
        }
    }

    // Get session ratings
    static async getSessionRatings(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Filter by userId and return last 30
            const userRatings = sessionRatings
                .filter(rating => rating.userId === userId)
                .slice(-30)
                .reverse();

            res.json(userRatings);
        } catch (error) {
            console.error('Error fetching session ratings:', error);
            res.status(500).json({ error: 'Failed to fetch session ratings' });
        }
    }

    // Add session rating
    static async addSessionRating(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { sessionDate, overallScore, discipline, patience, signalQuality, executionTiming, riskAdherence, explanation } = req.body;

            const rating = {
                id: Date.now().toString(),
                userId,
                sessionDate: new Date(sessionDate),
                overallScore,
                discipline,
                patience,
                signalQuality,
                executionTiming,
                riskAdherence,
                explanation
            };

            sessionRatings.push(rating);

            // Keep only last 100 ratings in memory
            if (sessionRatings.length > 100) {
                sessionRatings.shift();
            }

            res.json(rating);
        } catch (error) {
            console.error('Error adding session rating:', error);
            res.status(500).json({ error: 'Failed to add session rating' });
        }
    }

    // Get current regime state
    static async getRegimeState(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            res.json(regimeState);
        } catch (error) {
            console.error('Error fetching regime state:', error);
            res.status(500).json({ error: 'Failed to fetch regime state' });
        }
    }

    // Update regime state
    static async updateRegimeState(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { isNoTradeMode, reason } = req.body;

            regimeState = {
                userId,
                isNoTradeMode,
                reason,
                detectedAt: isNoTradeMode ? new Date() : null,
                updatedAt: new Date()
            };

            res.json(regimeState);
        } catch (error) {
            console.error('Error updating regime state:', error);
            res.status(500).json({ error: 'Failed to update regime state' });
        }
    }
}
