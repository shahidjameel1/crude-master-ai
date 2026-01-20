# Environment Setup Guide

## 1. Backend Setup

The backend handles all broker connections and trade execution. It requires strict environment variables.

1.  **Navigate to `backend/`**
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    - Copy `.env.example` to `.env` in the **ROOT** directory (one level up from backend).
    - Fill in your Angel One credentials.
    - **CRITICAL**: Generate a secure `TRADE_SECRET`:
      ```bash
      openssl rand -hex 32
      ```
      Or just use a long random string. Set this as `TRADE_SECRET` in `.env`.

4.  **Start Server**:
    ```bash
    npm start
    ```

## 2. Frontend Setup

The frontend is a dashboard that sends signed intents to the backend.

1.  **Navigate to `frontend/`**
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    - Copy `frontend/.env.example` to `frontend/.env`.
    - Set `VITE_TRADE_SECRET` to the **SAME** value as the backend's `TRADE_SECRET`.
    - **Note**: In a production web deployment, you would not expose this secret. For this local desktop-app, it serves as a bridge token.

4.  **Start Client**:
    ```bash
    npm run dev
    ```

## 3. Verification

- Open `http://localhost:5173`.
- Check backend console logs. You should see "Helmet/Security headers enabled" (implied by lack of startup errors).
- Try to execute a trade. It should succeed ONLY if the secrets match.
