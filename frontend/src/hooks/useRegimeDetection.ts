import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useRegimeDetection = () => {
    const {
        regimeState,
        updateRegimeState,
        addReasoningLog,
        confluenceScore,
        currentPrice
    } = useStore();

    useEffect(() => {
        const detectRegime = () => {
            const criteria = {
                lowConfluence: confluenceScore < 30,
                noPrice: !currentPrice || currentPrice <= 0,
                // Add more detection criteria here based on market data
            };

            const shouldEnterNoTrade = criteria.lowConfluence || criteria.noPrice;

            if (shouldEnterNoTrade && !regimeState.isNoTradeMode) {
                const reasons = [];
                if (criteria.lowConfluence) reasons.push('Low confluence (<30%)');
                if (criteria.noPrice) reasons.push('Invalid price feed');

                const reason = reasons.join(' + ');

                updateRegimeState({
                    isNoTradeMode: true,
                    reason,
                    detectedAt: Date.now()
                });

                addReasoningLog(
                    'PAUSED',
                    'No-trade regime detected',
                    reason
                );
            } else if (!shouldEnterNoTrade && regimeState.isNoTradeMode) {
                updateRegimeState({
                    isNoTradeMode: false,
                    reason: '',
                    detectedAt: null
                });

                addReasoningLog(
                    'SEARCHING',
                    'No-trade regime cleared',
                    'Market conditions improved'
                );
            }
        };

        const interval = setInterval(detectRegime, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [confluenceScore, currentPrice, regimeState.isNoTradeMode, updateRegimeState, addReasoningLog]);

    return {
        regimeState
    };
};
