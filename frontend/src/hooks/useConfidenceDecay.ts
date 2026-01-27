import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useConfidenceDecay = () => {
    const {
        confidenceDecayState,
        confidenceDetail,
        updateConfidenceDecay,
        updateConfidence,
        addReasoningLog
    } = useStore();

    useEffect(() => {
        const checkDecay = () => {
            const now = Date.now();
            const timeSinceLastSetup = now - confidenceDecayState.lastValidSetup;
            const DECAY_THRESHOLD = 120000; // 2 minutes without valid setup
            // const DECAY_INTERVAL = 10000; // Decay every 10 seconds

            // Start decaying if no valid setup for 2+ minutes
            if (timeSinceLastSetup > DECAY_THRESHOLD && confidenceDetail.score > 0) {
                if (!confidenceDecayState.isDecaying) {
                    updateConfidenceDecay({ isDecaying: true, decayRate: 1 });
                    addReasoningLog('ANALYZING', 'Confidence decay initiated', 'No valid setup detected for extended period');
                }

                // Apply decay
                const decayAmount = confidenceDecayState.decayRate;
                const newScore = Math.max(0, confidenceDetail.score - decayAmount);

                if (newScore !== confidenceDetail.score) {
                    updateConfidence(newScore, confidenceDetail.breakdown);
                }
            }
        };

        const interval = setInterval(checkDecay, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [confidenceDecayState, confidenceDetail, updateConfidenceDecay, updateConfidence, addReasoningLog]);

    const resetDecay = () => {
        updateConfidenceDecay({
            isDecaying: false,
            decayRate: 0,
            lastValidSetup: Date.now()
        });
    };

    const accelerateDecay = (rate: number) => {
        updateConfidenceDecay({ decayRate: rate });
    };

    return {
        confidenceDecayState,
        resetDecay,
        accelerateDecay
    };
};
