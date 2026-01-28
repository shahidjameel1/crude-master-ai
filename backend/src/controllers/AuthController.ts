import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setSystemMode } from '../server';

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'shahidjameel01';
        const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

        if (!username || !password) {
            res.status(400).json({ error: 'Missing credentials' });
            return;
        }

        // Mode detected ONLY from username prefix
        const isPaperRequest = username.startsWith('paper_');
        const baseUsername = isPaperRequest ? username.replace('paper_', '') : username;
        const intendedMode = isPaperRequest ? 'PAPER' : 'LIVE';

        console.log(`🔐 Login Attempt: [${username}] -> Detected Mode: [${intendedMode}]`);

        // Strict Credential Check
        if (baseUsername !== ADMIN_USERNAME) {
            res.status(401).json({ error: 'Invalid operator identity' });
            return;
        }

        const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            console.log(`❌ Login failed: Hash mismatch for [${username}]`);
            res.status(401).json({ error: 'Invalid cryptographic sequence' });
            return;
        }

        // Switch System Mode (Immutable for session)
        setSystemMode(intendedMode);

        console.log(`✅ Session Established: [${username}] Mode: [${intendedMode}]`);

        // Generate JWT with immutable mode and session ID
        const sessionId = `sid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const token = jwt.sign({ username, mode: intendedMode, sessionId }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            token,
            mode: intendedMode,
            message: `Session Established: ${intendedMode}`
        });
    }

    static logout(req: Request, res: Response): void {
        res.json({ message: 'Logged out' });
    }

    static check(req: Request, res: Response): void {
        const user = (req as any).user;
        const mode = (req as any).mode || (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase();

        res.json({
            authenticated: !!user,
            user: user || null,
            mode: mode
        });
    }
}
