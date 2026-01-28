import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

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

    const isAuthenticated = useStore(state => state.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) return;

        const checkHeartbeat = async () => {
            const start = Date.now();
            try {
                const token = localStorage.getItem('friday_auth_token');
                const res = await fetch('/api/security/heartbeat', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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
