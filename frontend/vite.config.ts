import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ['three', 'react', 'react-dom'],
    },
    optimizeDeps: {
        include: ['three', '@react-three/fiber', '@react-three/drei'],
    },
    server: {
        port: 5174, // Avoid 3000 (Orion) and 3001 (Backend)
        proxy: {
            '/api': {
                target: 'http://localhost:3002',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://localhost:3001',
                ws: true,
            },
        },
    },
    build: {
        sourcemap: false, // SECURITY: Hide source code in production
        target: 'esnext',
    },
    esbuild: {
        drop: ['console', 'debugger'], // SECURITY: Strip all logs/debuggers
    }
})
