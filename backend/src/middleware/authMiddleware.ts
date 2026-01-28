import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const MODE = (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase();

    // 1. PAPER Mode Bypass (Android/Termux Stability)
    // If in PAPER mode, we allow access to facilitate local inspection without auth loops
    // Check for token in cookies
    const token = req.cookies.auth_token;

    if (!token) {
        if (req.path !== '/api/auth/check') {
            console.warn(`🔞 Auth failed: No token found in cookies for ${req.path}`);
        }
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
        (req as any).mode = decoded.mode || 'PAPER';
        next();
    } catch (error) {
        if (MODE === 'PAPER') {
            (req as any).mode = 'PAPER';
            next();
            return;
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};
