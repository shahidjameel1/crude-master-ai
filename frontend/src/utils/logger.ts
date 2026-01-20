/// <reference types="vite/client" />

export const logger = {
    info: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.info(...args);
        }
    },
    warn: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.warn(...args);
        }
    },
    error: (...args: any[]) => {
        // Errors are critical, but we can silence them in strict covert mode if needed.
        // For now, allow errors but maybe sanitize?
        console.error(...args);
    },
    debug: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.debug(...args);
        }
    }
};
