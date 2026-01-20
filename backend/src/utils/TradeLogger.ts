import fs from 'fs';
import path from 'path';
import { Trade, MarketData } from '../types';

export class TradeLogger {
    private logPath: string;

    constructor() {
        this.logPath = path.join(process.cwd(), 'logs', 'trade_history.json');
        this.ensureLogDir();
    }

    private ensureLogDir() {
        const dir = path.dirname(this.logPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.logPath)) {
            fs.writeFileSync(this.logPath, JSON.stringify([], null, 2)); // Init empty array
        }
    }

    public async logTrade(trade: Trade, context?: any) {
        try {
            const currentHistory = JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));

            const tradeEntry = {
                ...trade,
                context: {
                    ...context,
                    loggedAt: new Date().toISOString()
                }
            };

            currentHistory.push(tradeEntry);
            fs.writeFileSync(this.logPath, JSON.stringify(currentHistory, null, 2));
            console.log(`[TradeLogger] Trade ${trade.id} logged successfully.`);
        } catch (error) {
            console.error('[TradeLogger] Failed to log trade:', error);
        }
    }

    public getHistory(): Trade[] {
        try {
            if (fs.existsSync(this.logPath)) {
                return JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));
            }
            return [];
        } catch (e) {
            return [];
        }
    }
}
