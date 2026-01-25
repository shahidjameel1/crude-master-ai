import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const usePatienceEngine = () => {
    const {
        patienceState,
        updatePatienceState,
        addReasoningLog,
        tradeHistory
    } = useStore();

    useEffect(() => {
        const checkPatienceLogic = () => {
            const now = Date.now();

            // Check if cooldown has expired
            if (patienceState.isActive && now >= patienceState.cooldownUntil) {
                updatePatienceState({ isActive: false, reason: '' });
                addReasoningLog('SEARCHING', 'Patience cooldown expired, resuming market scan');
            }
        };

        const interval = setInterval(checkPatienceLogic, 1000);
        return () => clearInterval(interval);
    }, [patienceState, updatePatienceState, addReasoningLog]);

    const activatePatienceCooldown = (durationMs: number, reason: string) => {
        const cooldownUntil = Date.now() + durationMs;
        updatePatienceState({
            isActive: true,
            cooldownUntil,
            reason
        });
        addReasoningLog('PAUSED', `Patience cooldown active: ${reason}`, `Cooldown until ${new Date(cooldownUntil).toLocaleTimeString()}`);
    };

    const incrementConsecutiveLosses = () => {
        const newCount = patienceState.consecutiveLosses + 1;
        updatePatienceState({ consecutiveLosses: newCount });

        // Increase cooldown after consecutive losses
        if (newCount >= 2) {
            const cooldownDuration = Math.min(newCount * 60000, 300000); // Max 5 minutes
            activatePatienceCooldown(cooldownDuration, `${newCount} consecutive losses detected`);
        }
    };

    const resetConsecutiveLosses = () => {
        updatePatienceState({ consecutiveLosses: 0 });
    };

    const enforceMinimumCooldown = () => {
        // Minimum 30 seconds between trades
        activatePatienceCooldown(30000, 'Minimum trade spacing');
    };

    return {
        patienceState,
        activatePatienceCooldown,
        incrementConsecutiveLosses,
        resetConsecutiveLosses,
        enforceMinimumCooldown
    };
};
