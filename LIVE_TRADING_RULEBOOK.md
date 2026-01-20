# LIVE TRADING RULEBOOK & OPERATING MANUAL

**Version**: 1.0 (Production Hardened)
**Asset**: CRUDEOIL / CRUDEOILM
**Strategy**: ICT/SMC Hybrid (5m/15m)

---

## 🚦 TRADING MODES

| Mode | Symbol | Broker Exec? | Capital Risk? | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **PAPER** | P | ❌ No | ❌ No | Strategy Testing & Logic Check |
| **SHADOW** | S | ❌ No | ❌ No | Forward Testing against Live Data (Logs only) |
| **ASSISTED** | A | ⚠️ Verify | ✅ Yes | Human-in-the-loop (Authorized via UI) |
| **LIVE** | L | ✅ Yes | ✅ Yes | Full Automation (Within Limits) |

**CRITICAL**: Mode is controlled ONLY by `TRADING_MODE` in `.env`. Restart required to change.

---

## 🛡️ DAILY RISK LIMITS (HARD STOPS)

1.  **Max Loss Limit**: ₹2,500 per day (0.5% of 5L account).
    -   *Action*: System locks until next session.
2.  **Max Trades**: 3 per day.
    -   *Action*: Signals ignored after 3 fills.
3.  **Drawdown Stop**: 5% trailing drawdown from peak equity.
    -   *Action*: Weekly lock.
4.  **Time Constraint**: Trading ONLY between 18:00 - 20:30 IST.

---

## 📜 EXECUTION PROTOCOL

### Before Session (17:45 IST)
- [ ] Check `TRADING_MODE` in terminal output.
- [ ] Verify **Heartbeat** is green on Dashboard.
- [ ] Check "Pre-Trade Checklist" (Mindset, News, Levels).
- [ ] Ensure Mobile is connected for monitoring (Read-Only).

### During Session
- **NEVER** manually override a trade placed by the Agent.
- **NEVER** add to a losing position (Martingale forbidden).
- **IF** "Kill Switch" needs activation -> Hit the red button. It will cancel open orders and lock the backend.

### Emergency Procedures
1.  **Order Stuck/Pending**: Log into Angel One mobile app -> Cancel manually.
2.  **System Freeze**: Hit `Ctrl + C` on backend terminal -> Restart.
3.  **Data Lag**: If Heartbeat > 500ms, pause trading.

---

## 🧠 STRATEGY RULES

- **Setup**: Must have Score >= 85 (A+) or 75 (A) with User Confirm.
- **Direction**: Only trade WITH the 15m Trend (EMA alignment).
- **Exits**:
    -   TP1: 20 points (Scale 50%)
    -   TP2: 50 points (Runner)
    -   SL: Structure-based (Max 25 points)

---

## ✅ GO-LIVE CHECKLIST (FINAL GATE)

- [ ] Paper Trading Profitable (30 days data)
- [ ] No API Keys in Git History
- [ ] Secret Token Rotated
- [ ] Production Build (No Console Logs)
- [ ] Cloudflare/VPN active for Remote Access

**"Slow is Smooth. Smooth is Fast."**

---

## 🏎️ FINAL LIVE TRADING RULEBOOK (EXECUTIVE SUMMARY)

-   **Default Instrument**: Crude Oil Mini (CRUDEOILM)
-   **Structure**: 15m Trend + 5m Entry
-   **Target**: Opportunity-based (Score > 85)
-   **Max Trades/Day**: 2 (Hard Stop at 3)
-   **Risk**: ≤1% per trade
-   **Compounding**: Weekly only (No daily size increase)
-   **Mobile**: View-only Dashboard (No execution buttons)
-   **Human Role**: Final Authority (Kill Switch Only)
