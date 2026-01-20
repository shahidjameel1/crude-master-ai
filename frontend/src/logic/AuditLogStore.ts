export interface AuditEntry {
    timestamp: number;
    eventId: string;
    type: 'DECISION' | 'EXECUTION' | 'SYSTEM' | 'ERROR';
    strategyVersion: string;
    ruleVersion: string;
    marketSnapshot: {
        price: number;
        score: number;
        vwap: number;
        isKillZone: boolean;
        volatility: number;
    };
    decision: {
        action: 'BLOCK' | 'EXECUTE' | 'PAUSE';
        reason: string;
        confluenceBreakdown: any;
    };
    riskDecision?: {
        qty: number;
        lots: number;
        sl: number;
        tp: number;
        riskPercent: number;
    };
    brokerStatus?: string;
}

export function saveAuditLog(entry: AuditEntry) {
    const logs = getAuditLogs();
    logs.push(entry);
    // Keep last 1000 logs for performance
    const trimmedLogs = logs.slice(-1000);
    localStorage.setItem('CRUDE_MASTER_AUDIT_TRAIL', JSON.stringify(trimmedLogs));
}

export function getAuditLogs(): AuditEntry[] {
    const saved = localStorage.getItem('CRUDE_MASTER_AUDIT_TRAIL');
    return saved ? JSON.parse(saved) : [];
}

export function generateEventId() {
    return `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
