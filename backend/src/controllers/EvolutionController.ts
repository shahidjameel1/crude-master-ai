import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EvolutionController {
    // Get evolution logs
    static async getEvolutionLogs(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const logs = await prisma.evolutionLog.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                take: 100
            });

            res.json(logs);
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

            const log = await prisma.evolutionLog.create({
                data: {
                    userId,
                    confirmation,
                    oldWeight,
                    newWeight,
                    reason,
                    sampleSize,
                    timestamp: new Date()
                }
            });

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

            const ratings = await prisma.sessionRating.findMany({
                where: { userId },
                orderBy: { sessionDate: 'desc' },
                take: 30
            });

            res.json(ratings);
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

            const rating = await prisma.sessionRating.create({
                data: {
                    userId,
                    sessionDate: new Date(sessionDate),
                    overallScore,
                    discipline,
                    patience,
                    signalQuality,
                    executionTiming,
                    riskAdherence,
                    explanation
                }
            });

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

            const state = await prisma.regimeState.findFirst({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
            });

            res.json(state || { isNoTradeMode: false, reason: '', detectedAt: null });
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

            // Delete old state and create new one
            await prisma.regimeState.deleteMany({ where: { userId } });

            const state = await prisma.regimeState.create({
                data: {
                    userId,
                    isNoTradeMode,
                    reason,
                    detectedAt: isNoTradeMode ? new Date() : null
                }
            });

            res.json(state);
        } catch (error) {
            console.error('Error updating regime state:', error);
            res.status(500).json({ error: 'Failed to update regime state' });
        }
    }
}
