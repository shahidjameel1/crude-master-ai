export class HealthService {
    private static startTime = Date.now();
    private static lastLatency = 0;

    /**
     * Set the last recorded latency to the broker/API
     */
    static setLatency(ms: number) {
        this.lastLatency = ms;
    }

    static getMetrics() {
        return {
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            latencyMs: this.lastLatency,
            timestamp: new Date()
        };
    }

    /**
     * Check actual connectivity to core services
     */
    static async checkConnectivity(): Promise<{ database: boolean; broker: boolean; feed: boolean }> {
        // In a real prod environment, we would ping the broker API or check socket state
        // For now, we'll return a more honest assessment than hardcoded 'true'
        return {
            database: true, // We are using file-based storage, so always true if functional
            broker: !!(global as any).smartApiInitialized,
            feed: !!(global as any).wsClientConnected
        };
    }
}
