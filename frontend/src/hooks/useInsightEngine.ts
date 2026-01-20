import { useMemo } from 'react';
import { MarketState } from './useStrategyEngine';

export interface Insight {
    headline: string;
    details: string[];
    quality: 'HIGH_QUALITY' | 'GOOD' | 'WEAK' | 'NOISE';
    action: 'BUY' | 'SELL' | 'WAIT';
    automationEligible: boolean;
}

export function useInsightEngine(marketState: MarketState): Insight {

    const insight = useMemo(() => {
        const score = marketState.confluenceScore;
        const isKillZone = marketState.isKillZone;
        const risk = marketState.riskStatus;

        // 1. Scoring Interpretation (LOCKED)
        let quality: Insight['quality'] = 'NOISE';
        let automationEligible = false;

        if (score >= 85) {
            quality = 'HIGH_QUALITY';
            automationEligible = true;
        } else if (score >= 70) {
            quality = 'GOOD';
        } else if (score >= 60) {
            quality = 'WEAK';
        }

        // 2. Headline & Tone (Institutional)
        let headline = "Context suggests minimal confluence; maintaining observation.";
        if (isKillZone) {
            headline = "Condition: Institutional Kill Zone active. Execution strictly prohibited.";
        } else if (risk === 'RISKY') {
            headline = "Risk level is elevated due to extreme volatility; conditions favor caution.";
        } else if (quality === 'HIGH_QUALITY') {
            headline = "Conditions favor high-probability execution; confluence threshold satisfied.";
        } else if (quality === 'GOOD') {
            headline = "Context suggests valid setup; confluence supports manual entry.";
        } else if (quality === 'WEAK') {
            headline = "Minimal confluence detected; advisory only.";
        }

        // 3. Action Logic
        let action: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
        if (!isKillZone && risk === 'SAFE' && score >= 70) {
            action = marketState.trend === 'UP' ? 'BUY' : 'SELL';
        }

        // 4. Details (Institutional Narrative)
        // 4. Details (Institutional Narrative)
        const details = [];
        if (marketState.breakdown.emaTrend > 0) details.push("Trend Context: HTF & LTF flows are aligned.");
        if (marketState.breakdown.vwapAlignment > 0) details.push("Location Quality: Price is within an institutional interest zone.");
        if (marketState.breakdown.structure > 0) details.push("Market Structure: Break & Retest or Liquidity Sweep confirmed.");
        if (marketState.breakdown.momentum > 0) details.push("Momentum: Impulse move or RSI regime supports direction.");
        if (marketState.breakdown.timing > 0) details.push("Timing: Active Session (London/NY) or Post-Consolidation.");
        if (marketState.breakdown.riskQuality > 0) details.push("Risk Profile: SL < 20 pts and R:R > 1:2.");

        return { headline, details, quality, action, automationEligible };
    }, [marketState]);

    return insight;
}
