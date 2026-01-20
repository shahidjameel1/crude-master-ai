@echo off
echo Starting CRUDE-MASTER AI System...
echo ===================================

echo Starting Backend Server...
start "CRUDE-MASTER Backend" cmd /k "cd backend && npm install && npx tsx src/server.ts"

echo Starting Frontend Dashboard...
start "CRUDE-MASTER Frontend" cmd /k "cd frontend && npm run dev"

echo ===================================
echo System launching... Access dashboard at http://localhost:3000
