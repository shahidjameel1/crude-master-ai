import { useState, useEffect } from 'react';

export interface HeartbeatStatus {
    status: 'OK' | 'DEGRADED' | 'DOWN';
    latency: number;
    lastCheck: number;
}

export const useHeartbeat = () => {
    const [status, setStatus] = useState<HeartbeatStatus>({
        status: 'OK',
        latency: 0,
        lastCheck: Date.now()
    });

    useEffect(() => {
        const checkHeartbeat = async () => {
            const start = Date.now();
            try {
                const res = await fetch('http://localhost:3000/api/security/heartbeat');
                const end = Date.now();
                if (res.ok) {
                    setStatus({
                        status: 'OK',
                        latency: end - start,
                        lastCheck: end
                    });
                } else {
                    setStatus({ status: 'DEGRADED', latency: end - start, lastCheck: end });
                }
            } catch (e) {
                setStatus({ status: 'DOWN', latency: 0, lastCheck: Date.now() });
            }
        };

        const interval = setInterval(checkHeartbeat, 5000); // Check every 5s
        checkHeartbeat();

        return () => clearInterval(interval);
    }, []);

    return status;
};
