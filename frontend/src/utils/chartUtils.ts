export const contractExpiryStatus = (symbol: string) => {
    // Helper to display contract status
    return symbol.includes('JAN') ? 'JAN EXP' : 'FEB EXP';
};
