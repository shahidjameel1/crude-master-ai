import fs from 'fs';
import path from 'path';

interface SystemState {
    automationMode: 'OFF' | 'ASSIST' | 'AUTO';
    maxDailyLoss: number;
    riskPerTrade: number;
    maxTradesPerDay: number;
    accountSize: number;
    defaultTrade: string;
    globalKillSwitch: boolean;
}

const STATE_FILE = path.resolve(__dirname, '../../data/system_state.json');

export class SystemStateService {
    private state: SystemState;

    constructor() {
        this.state = this.loadState();
    }

    private loadState(): SystemState {
        try {
            if (fs.existsSync(STATE_FILE)) {
                const data = fs.readFileSync(STATE_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load system state:', error);
        }

        // Defaults
        return {
            automationMode: 'OFF',
            maxDailyLoss: 2500,
            riskPerTrade: 1,
            maxTradesPerDay: 3,
            accountSize: 500000,
            defaultTrade: 'CRUDEOILM',
            globalKillSwitch: false
        };
    }

    public getState(): SystemState {
        return { ...this.state };
    }

    public updateState(partial: Partial<SystemState>) {
        this.state = { ...this.state, ...partial };
        this.saveState();
    }

    private saveState() {
        try {
            const dir = path.dirname(STATE_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
        } catch (error) {
            console.error('Failed to save system state:', error);
        }
    }
}

export const systemState = new SystemStateService();
