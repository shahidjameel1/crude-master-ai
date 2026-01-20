# Crude Master AI - Trading Operating System

**A production-grade, hardened trading system for the Crude Oil Mini (MCX) market.**

This repository contains the full source code for the Crude Master AI, a specialized trading assistant designed for institutional-grade reliability, security, and risk management.

## 🚀 Features

-   **Intent Firewall**: Server-side execution gate that verifies every trade request.
-   **Risk Engine**: Strict daily loss limits, drawdown stops, and position sizing.
-   **Security**: No client-side credentials. All secrets managed via environment variables.
-   **Glass Mode**: Read-only "shadow" trading for forward testing strategies.
-   **Hybrid Strategy**: Combines ICT Concepts (FVG, Order Blocks) with SMC logic.

## 🏗️ Architecture

-   **Backend**: Node.js/Express (Port 3002). Handles broker connection and logic.
-   **Frontend**: React/Vite (Port 5173). Dashboard for monitoring and assisted control.

## 🔒 Security

This system implements a "Zero Trust" architecture:
1.  **No Secrets in Repo**: All keys are loaded from `.env` (not committed).
2.  **No Frontend Exec**: The browser cannot execute trades directly; it sends signed intents.
3.  **Kill Switch**: Hardware-level software lock to halt all operations instantly.

## 🛠️ Usage

### Prerequisites
-   Node.js v18+
-   Angel One SmartAPI Account

### Setup
1.  Clone repository.
2.  Copy `.env.example` to `.env` in `backend/` and `frontend/`.
3.  Configure your broker credentials and `TRADE_SECRET`.
4.  Run `npm install` in both directories.

### Running
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

## 📜 License
Private / Proprietary.
