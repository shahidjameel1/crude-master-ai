/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                card: '#1E2433',
                primary: '#0A0E1A',
                secondary: '#151923',
                accent: '#3B82F6',
                purple: '#8B5CF6',
                cyan: '#06B6D4',
                success: '#10B981',
                error: '#EF4444',
                warning: '#F59E0B',
                text: {
                    primary: '#FFFFFF',
                    secondary: '#94A3B8',
                    tertiary: '#64748B',
                },
                border: 'rgba(255, 255, 255, 0.1)',
            },
            boxShadow: {
                glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'blue-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
                'purple-glow': '0 0 30px rgba(139, 92, 246, 0.4)',
                'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.3)',
                'success-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
                'error-glow': '0 0 20px rgba(239, 68, 68, 0.3)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            }
        },
    },
    plugins: [],
}
