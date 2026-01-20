/**
 * MCX Market Hours Utility
 * MCX Crude Oil Trading Hours: Monday-Friday, 09:00 AM - 11:30 PM IST
 */

export interface MarketStatus {
    isOpen: boolean;
    statusText: string;
    nextOpenTime?: Date;
    nextCloseTime?: Date;
}

export function getMCXMarketStatus(): MarketStatus {
    const now = new Date();

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);

    const dayOfWeek = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;

    // MCX Trading Hours: 09:00 - 23:30 IST (Monday-Friday)
    const marketOpenTime = 9 * 60; // 09:00 = 540 minutes
    const marketCloseTime = 23 * 60 + 30; // 23:30 = 1410 minutes

    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return {
            isOpen: false,
            statusText: 'Market Closed (Weekend)',
        };
    }

    // Check if within trading hours
    const isOpen = currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime;

    if (isOpen) {
        return {
            isOpen: true,
            statusText: 'Market Open',
        };
    } else {
        // Market is closed (weekday but outside hours)
        if (currentTimeInMinutes < marketOpenTime) {
            return {
                isOpen: false,
                statusText: 'Market Closed (Pre-Market)',
            };
        } else {
            return {
                isOpen: false,
                statusText: 'Market Closed',
            };
        }
    }
}

export function formatMarketTime(date: Date): string {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}
