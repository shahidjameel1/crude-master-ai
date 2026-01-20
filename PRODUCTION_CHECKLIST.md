# Production Security Checklist

## 🔒 Pre-Deployment
- [ ] **Secrets removed from Git**: Ensure `.env` files are in `.gitignore`.
- [ ] **Strong Secrets**: `TRADE_SECRET` is at least 32 characters long.
- [ ] **Dependencies**: `npm audit` returns no critical vulnerabilities.
- [ ] **Logs**: No `console.log` of raw trade payloads or tokens.

## 🚀 Runtime
- [ ] **HTTPS**: If deploying remotely, use Nginx/Caddy with SSL.
- [ ] **Firewall**: Port 3002 (Backend) should NOT be exposed to the public internet. Only localhost or VPN.
- [ ] **Rate Limiting**: Verify excessive requests are blocked.
- [ ] **CORS**: Verify only the specific frontend domain can access the API.

## 🛡️ Monitoring
- [ ] **Audit Trail**: Monitor server logs for "BLOCKED" or "UNAUTHORIZED" attempts.
- [ ] **Heartbeat**: Ensure `/api/security/heartbeat` is pinging correctly.
