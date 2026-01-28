import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const MODE = (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase();

    // 1. Extract Token from Authorization Header (Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        if (req.path !== '/api/auth/check') {
            console.warn(`🔞 Auth failed: No Bearer token found in Authorization header for ${req.path}`);
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
        // If token invalid but in PAPER mode config, we might allow (optional, check requirement)
        // User said: "All protected APIs use Authorization header"
        // "One login = one mode"
        res.status(401).json({ error: 'Invalid token' });
    }
};
