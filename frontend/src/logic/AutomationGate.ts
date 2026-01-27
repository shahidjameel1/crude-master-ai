import { MarketState } from '../hooks/useStrategyEngine';
import { saveAuditLog, generateEventId } from './AuditLogStore';

export interface AutomationLawResult {
    passed: boolean;
    reason: string;
}

export class AutomationGate {
    static checkLaws(
        marketState: MarketState,
        currentPrice: number,
        _automationMode: 'STRATEGY_LIMITED' | 'MULTI' | 'FULL_SESSION',
        pointsToday: number,
        targetPoints: number,
        stopLossPoints: number
    ): AutomationLawResult {
        const eventId = generateEventId();
        // console.log(`[AutomationGate] Checking laws for mode: ${automationMode}`); // REMOVED FOR SECURITY

        // 1. Kill Zone Law (NON-NEGOTIABLE)
        if (marketState.isKillZone) {
            const reason = 'LAW_VIOLATION: Kill Zone Active (12:30-14:00 IST). Execution Blocked.';
            this.logBlock(eventId, marketState, currentPrice, reason);
            return { passed: false, reason };
        }

        // 2. Confidence Law (Automation Threshold = 85+)
        if (marketState.confluenceScore < 85) {
            const reason = `LAW_VIOLATION: Confluence Score (${marketState.confluenceScore}) below Master threshold (85).`;
            this.logBlock(eventId, marketState, currentPrice, reason);
            return { passed: false, reason };
        }

        // 3. Risk Law: Daily Point Stop
        if (pointsToday <= stopLossPoints) {
            const reason = `LAW_VIOLATION: Daily Loss Stop (${pointsToday} pts) reached. Trading Suspended.`;
            this.logBlock(eventId, marketState, currentPrice, reason);
            return { passed: false, reason };
        }

        // 4. Defensive Law: Post-Target Capping
        if (pointsToday >= targetPoints) {
            if (marketState.confluenceScore < 90) {
                const reason = `DEFENSIVE_MODE: Target achieved. Requiring A+ Setup (90+) for further engagement. Current: ${marketState.confluenceScore}`;
                this.logBlock(eventId, marketState, currentPrice, reason);
                return { passed: false, reason };
            }
        }

        // 5. Volatility Law
        if (marketState.riskStatus === 'RISKY') {
            const reason = 'LAW_VIOLATION: High Market Volatility/Risk detected. Execution Paused.';
            this.logBlock(eventId, marketState, currentPrice, reason);
            return { passed: false, reason };
        }

        return { passed: true, reason: 'All laws verified. Execution permitted.' };
    }

    private static logBlock(eventId: string, marketState: MarketState, price: number, reason: string) {
        saveAuditLog({
            timestamp: Date.now(),
            eventId,
            type: 'DECISION',
            strategyVersion: '1.0.0-DETERMINISTIC',
            ruleVersion: 'LAW_V1',
            marketSnapshot: {
                price,
                score: marketState.confluenceScore,
                vwap: 0,
                isKillZone: marketState.isKillZone,
                volatility: 0
            },
            decision: {
                action: 'BLOCK',
                reason,
                confluenceBreakdown: {}
            }
        });
    }
}
