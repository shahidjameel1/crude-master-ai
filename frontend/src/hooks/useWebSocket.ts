import { useEffect, useRef, useState } from 'react';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
    type: string;
    data: any;
}

export function useWebSocket(url: string = 'ws://localhost:3001') {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();
    const retryCountRef = useRef(0);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [url]);

    const connect = () => {
        try {
            setStatus('connecting');
            const ws = new WebSocket(url);
            wsRef.current = ws;

            // Health Check: If no message (PING or DATA) received in 45s, reconnect
            const startHeartbeatTimer = () => {
                if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = setTimeout(() => {
                    console.warn('⚠️ WS Heartbeat timeout - Reconnecting...');
                    ws.close();
                }, 45000);
            };

            ws.onopen = () => {
                setStatus('connected');
                console.log('✅ WS Connected');
                retryCountRef.current = 0; // Reset retries on success
                startHeartbeatTimer();
            };

            ws.onmessage = (event) => {
                try {
                    startHeartbeatTimer(); // Reset death timer
                    const message = JSON.parse(event.data);

                    // Filter PING to prevent re-renders
                    if (message.type === 'PING') {
                        // console.debug('💓 PING received');
                        return;
                    }

                    setLastMessage(message);
                } catch (e) {
                    console.error('Failed to parse WS message', event.data);
                }
            };

            ws.onclose = () => {
                setStatus('disconnected');
                if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);

                // Exponential Backoff: 1s, 2s, 4s, 8s... max 30s
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                console.log(`🔄 WS Disconnected. Reconnecting in ${delay}ms... (Attempt ${retryCountRef.current + 1})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    retryCountRef.current += 1;
                    connect();
                }, delay);
            };

            ws.onerror = (error) => {
                console.error('WS Error', error);
                setStatus('error');
                ws.close();
            };
        } catch (e) {
            console.error('WS Connection failed', e);
            setStatus('error');

            // Retry even on immediate fail
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 5000);
        }
    };

    const disconnect = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
        }
    };

    const sendMessage = (type: string, data: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, data }));
        }
    };

    return { status, lastMessage, sendMessage };
}
