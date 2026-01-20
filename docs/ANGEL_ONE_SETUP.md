# Angel One API Setup Guide

## Prerequisites
- Active Angel One Trading Account
- MCX Segment Enabled
- Demat Account Active

---

## Step 1: Create Angel One Account

1. Visit https://www.angelone.in
2. Click "Open Demat Account"
3. Complete KYC process (PAN, Aadhaar, Bank Account)
4. Enable **MCX Commodity Trading** segment
   - Login to Angel One website
   - Go to Profile → Segments
   - Activate MCX
5. Fund your account (minimum ₹10,000 recommended for testing)

---

## Step 2: Get API Credentials

### Register for SmartAPI

1. Visit https://smartapi.angelbroking.com
2. Click "Get Started" or "Register"
3. Login with your Angel One credentials
4. Accept Terms & Conditions
5. You'll receive:
   - **Client ID** (your trading account number)
   - **API Key**
   - **Secret Key**

### Generate TOTP Secret (Optional for auto-login)

For automated login without manual OTP:
1. In SmartAPI portal, enable TOTP
2. Download authenticator app (Google Authenticator)
3. Scan QR code to get `TOTP_SECRET`
4. Store securely in `.env` file

---

## Step 3: Test API Connection

### Install SmartAPI SDK

```bash
npm install smartapi-javascript
```

### Test Script

Create `test-angel-one.ts`:

```typescript
import { SmartAPI } from 'smartapi-javascript';

const api = new SmartAPI({
  api_key: 'YOUR_API_KEY',
  client_code: 'YOUR_CLIENT_ID',
  password: 'YOUR_PASSWORD'
});

async function testConnection() {
  try {
    const session = await api.generateSession(client_code, password);
    console.log('✅ Connected to Angel One');
    console.log('Session Token:', session.data.jwtToken);
    
    // Test fetching MCX Crude Oil data
    const data = await api.getMarketData('MCX', 'CRUDEOIL', '1m');
    console.log('✅ Market data fetched:', data);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

Run:
```bash
npx tsx test-angel-one.ts
```

---

## Step 4: Configure CRUDE-MASTER AI

### Update `.env` File

```bash
# Angel One API Credentials
ANGEL_CLIENT_ID=A123456          # Your client code
ANGEL_PASSWORD=YourPassword123   # Trading password
ANGEL_API_KEY=abcd1234efgh5678   # From SmartAPI portal
ANGEL_SECRET_KEY=xyz9876wxyz     # From SmartAPI portal
ANGEL_TOTP_SECRET=ABCD1234EFGH   # Optional, for auto-login

# Trading Mode
TRADING_MODE=paper               # Start with paper trading
```

### Security Best Practices

1. **Never commit `.env` to Git**
   - It's already in `.gitignore`

2. **Encrypt sensitive data**
   - Use environment variables in production
   - Consider using AWS Secrets Manager or similar

3. **Use separate API keys for testing**
   - Create a test API key for development
   - Use production key only when going live

---

## Step 5: Paper Trading Setup

### Enable Paper Trading Mode

In `.env`:
```bash
TRADING_MODE=paper
```

This will:
- ✅ Connect to Angel One for LIVE data
- ✅ Execute trades virtually (no real money)
- ✅ Log all trades to database
- ✅ Perfect for testing system performance

### Run Paper Trading

```bash
npm run dev:backend
```

Monitor in dashboard:
- Real-time MCX Crude Oil prices
- System generating signals
- Trades executed in paper mode
- P&L tracked virtually

---

## Step 6: Go Live (After Testing)

### Checklist Before Live Trading

- [ ] Tested in demo mode (10+ trades)
- [ ] Ran paper trading for 30+ days
- [ ] Win rate > 60%
- [ ] Sharpe ratio > 1.5
- [ ] Max drawdown < 10%
- [ ] Reviewed all trade logs
- [ ] Comfortable with risk parameters
- [ ] Sufficient account balance (minimum ₹50,000)

### Enable Live Trading

1. Update `.env`:
```bash
TRADING_MODE=live
```

2. Restart backend:
```bash
npm run dev:backend
```

3. **Monitor closely**:
   - Watch first 5 trades in real-time
   - Verify orders executing correctly on Angel One
   - Check fills, slippage, commissions

4. **Start small**:
   - Begin with 1 lot per trade
   - Scale up only after consistent performance

---

## Step 7: API Rate Limits & Best Practices

### Angel One Rate Limits

- **Order API**: 5 requests/second
- **Market Data**: 1 request/second
- **Session**: 1 login per day recommended

### Optimization Tips

1. **Cache market data** in database (already implemented)
2. **WebSocket for live data** instead of polling
3. **Batch requests** where possible
4. **Retry logic** for failed requests

---

## Step 8: Troubleshooting

### Common Issues

#### 1. "Invalid Session" Error
**Solution**: Session expires every 24 hours
- Re-authenticate daily
- Or implement auto-refresh (use TOTP)

#### 2. "Insufficient Margin" Error
**Solution**: MCX trades require margin
- Check margin requirements for Crude Oil
- Maintain 2x margin buffer

#### 3. "Symbol not found" Error
**Solution**: Use correct symbol format
- MCX Crude Oil: `CRUDEOIL`
- Check expiry date for futures

#### 4. Order Rejected
**Possible causes**:
- Market closed (MCX: 9 AM - 11:30 PM IST)
- Insufficient funds
- Price outside circuit limits
- Invalid stop loss/target

---

## Step 9: Monitor & Maintain

### Daily Tasks

1. **Check system health**:
   ```bash
   npm run health-check
   ```

2. **Review overnight trades** (if any)
   - Login to dashboard
   - Check trade journal

3. **Update news calendar**
   - Mark high-impact events (OPEC meetings, EIA reports)
   - System will auto-pause trading

### Weekly Tasks

1. **Analyze performance**:
   - Win rate by strategy
   - Best/worst times of day
   - Market regime performance

2. **Backup database**:
   ```bash
   npm run backup-trades
   ```

3. **Update strategies** (if needed)
   - Adjust parameters based on learning

---

## Step 10: Costs & Fees

### Angel One Charges (Approximate)

- **Brokerage**: ₹20 per executed order (or 0.05%)
- **Exchange Fees**: MCX charges
- **GST**: 18% on brokerage
- **Turnover Fee**: ~₹10 per crore
- **SEBI Fee**: ₹10 per crore

### Example Trade Cost

For 1 lot Crude Oil trade (100 barrels):
- Entry: ₹20 brokerage
- Exit: ₹20 brokerage
- Total: ~₹50-100 per round trip

**Factor this into your profit targets!**

---

## Support

### Angel One Support
- **Customer Care**: 1800-209-9191
- **Email**: care@angelone.in
- **API Support**: smartapi@angelone.in

### CRUDE-MASTER AI Support
- Check `README.md` for documentation
- Review `docs/STRATEGIES.md` for trading logic
- Raise issues in project repository

---

## 📝 Summary Checklist

- [ ] Angel One account created & MCX enabled
- [ ] SmartAPI credentials obtained
- [ ] Test connection successful
- [ ] `.env` file configured
- [ ] Paper trading running smoothly
- [ ] 30-day paper trading results reviewed
- [ ] Ready for live trading (your decision!)

---

**Remember**: Start with paper trading. Only go live after you're **100% confident** in the system's performance! 🚀
