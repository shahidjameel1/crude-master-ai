import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useSessionProfile = () => {
    const { sessionProfile, setSessionProfile, addReasoningLog } = useStore();

    useEffect(() => {
        const detectSession = () => {
            const now = new Date();
            const hour = now.getUTCHours();

            // Session detection based on UTC time
            // Asia: 00:00-08:00 UTC
            // London: 08:00-16:00 UTC
            // NY: 16:00-24:00 UTC

            let detectedProfile: 'ASIA' | 'LONDON' | 'NY';

            if (hour >= 0 && hour < 8) {
                detectedProfile = 'ASIA';
            } else if (hour >= 8 && hour < 16) {
                detectedProfile = 'LONDON';
            } else {
                detectedProfile = 'NY';
            }

            if (detectedProfile !== sessionProfile) {
                setSessionProfile(detectedProfile);

                const profiles = {
                    ASIA: 'Conservative, higher patience, mean-reversion bias',
                    LONDON: 'Structure-sensitive, breakout validation focus',
                    NY: 'Momentum-aware, volatility-adjusted aggression'
                };

                addReasoningLog(
                    'SEARCHING',
                    `${detectedProfile} session profile activated`,
                    profiles[detectedProfile]
                );
            }
        };

        // Check on mount and every hour
        detectSession();
        const interval = setInterval(detectSession, 3600000); // Every hour

        return () => clearInterval(interval);
    }, [sessionProfile, setSessionProfile, addReasoningLog]);

    const getSessionConfig = () => {
        const configs = {
            ASIA: {
                confidenceThreshold: 75, // Higher threshold (conservative)
                patienceMultiplier: 1.5,
                riskSensitivity: 'HIGH'
            },
            LONDON: {
                confidenceThreshold: 65, // Medium threshold
                patienceMultiplier: 1.2,
                riskSensitivity: 'MEDIUM'
            },
            NY: {
                confidenceThreshold: 60, // Lower threshold (aggressive)
                patienceMultiplier: 1.0,
                riskSensitivity: 'MEDIUM'
            }
        };

        return configs[sessionProfile];
    };

    return {
        sessionProfile,
        sessionConfig: getSessionConfig()
    };
};
