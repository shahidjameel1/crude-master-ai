import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.response.use(
    response => response,
    error => {
        // Standardized error handling
        const message = error.response?.data?.message || 'Unknown network error';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export const endpoints = {
    getStrategies: () => api.get('/strategies'),
    getTradeHistory: () => api.get('/trades'),
    getPerformance: () => api.get('/performance'),
    getLatestSignals: () => api.get('/signals/current'),

    // Control endpoints
    pauseTrading: () => api.post('/control/pause'),
    resumeTrading: () => api.post('/control/resume'),
    switchMode: (mode: 'demo' | 'paper' | 'live') => api.post('/control/mode', { mode }),

    // Backtest
    runBacktest: (config: any) => api.post('/backtest/run', config),
};

export default api;
