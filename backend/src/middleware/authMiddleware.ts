import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    // Check for token in cookies
    const token = req.cookies.auth_token;

    if (!token) {
        console.warn(`🔞 Auth failed: No token found in cookies for ${req.path}`);
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
