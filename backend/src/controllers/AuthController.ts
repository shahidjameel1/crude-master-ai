import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setSystemMode } from '../server';

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        const { username, password, mode } = req.body;
        console.log(`🔐 Login Attempt: [${username}] Mode: [${mode}] (PWD Length: ${password?.length || 0})`);

        const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
        const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

        if (!username || !password) {
            res.status(400).json({ error: 'Missing credentials' });
            return;
        }

        // Mode is chosen ONLY at login and is IMMUTABLE for the session
        const intendedMode = (mode === 'LIVE' || mode === 'PAPER') ? mode : 'PAPER';
        const isValidUser = username === ADMIN_USERNAME;

        if (!isValidUser) {
            res.status(401).json({ error: 'Invalid username' });
            return;
        }

        const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            console.log(`❌ Login failed: Password mismatch for user [${username}]`);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Switch System Mode
        setSystemMode(intendedMode);

        console.log(`✅ Login successful for user: [${username}] -> Switching to ${intendedMode} MODE`);

        // Generate JWT with immutable mode and session ID
        const sessionId = `sid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const token = jwt.sign({ username, mode: intendedMode, sessionId }, JWT_SECRET, { expiresIn: '24h' });

        // Set HttpOnly cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: `Login successful. Mode: ${intendedMode}`, mode: intendedMode });
    }

    static logout(req: Request, res: Response): void {
        res.clearCookie('auth_token');
        res.json({ message: 'Logged out' });
    }

    static check(req: Request, res: Response): void {
        const MODE = (process.env.MODE || process.env.TRADING_MODE || 'PAPER').toUpperCase();

        // If middleware passed, or we are in PAPER mode bypass
        res.json({
            authenticated: true,
            mode: MODE,
            isPaperBypass: MODE === 'PAPER' && !req.cookies.auth_token
        });
    }
}
