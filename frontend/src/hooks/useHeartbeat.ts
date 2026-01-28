import { useState, useEffect } from 'react';

export interface HeartbeatStatus {
    status: 'HEALTHY' | 'DEGRADED' | 'UNSAFE';
    latency: number;
    lastCheck: number;
}

export const useHeartbeat = () => {
    const [status, setStatus] = useState<HeartbeatStatus>({
        status: 'HEALTHY',
        latency: 0,
        lastCheck: Date.now()
    });

    useEffect(() => {
        const checkHeartbeat = async () => {
            const start = Date.now();
            try {
                const res = await fetch('/api/security/heartbeat', {
                    credentials: 'include'
                });
                const data = await res.json();
                const end = Date.now();

                if (res.ok) {
                    setStatus({
                        status: data.status, // Use backend status (HEALTHY / DEGRADED / UNSAFE)
                        latency: end - start,
                        lastCheck: end
                    });
                } else {
                    setStatus({ status: 'UNSAFE', latency: end - start, lastCheck: end });
                }
            } catch (e) {
                setStatus({ status: 'UNSAFE', latency: 0, lastCheck: Date.now() });
            }
        };

        const interval = setInterval(checkHeartbeat, 5000); // Check every 5s
        checkHeartbeat();

        return () => clearInterval(interval);
    }, []);

    return status;
};
