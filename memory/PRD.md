# Whalers on the Moon - PRD

## Original Problem Statement
Build a real-time Whale Transaction Tracker for the Solana and Base networks called "Whalers on the Moon".
- UI: One simple dashboard with a scrolling list of 'Big Moves.' Each move should show the Token Name, Amount in CAD, and a 'View on Explorer' link.
- Logic: Use the Helius API for Solana and the Covalent API for Base. Only show transactions larger than $100,000 CAD.
- Design: Use a high-contrast 'Terminal' look (black background, green text). Add a big 'Subscribe for Alerts' button at the top.

## User Personas
1. **Crypto Trader** - Wants to track whale movements to inform trading decisions
2. **Market Analyst** - Monitors large transactions for market insights
3. **Casual Investor** - Subscribes to alerts for awareness of big moves

## Core Requirements (Static)
- [x] Real-time whale transaction tracking
- [x] Support for Solana (Helius API) and Base (Covalent API) networks
- [x] Threshold filtering: Only transactions > $100,000 CAD
- [x] Terminal-style UI with black background and green text
- [x] Email subscription for alerts
- [x] Auto-refresh every 30 seconds
- [x] Sound notifications for new whale moves

## What's Been Implemented
### Date: 2026-03-27
- **Backend (FastAPI)**:
  - GET /api/transactions - Fetches whale transactions from Solana and Base
  - POST /api/subscribe - Email subscription endpoint
  - GET /api/health - Health check endpoint
  - GET /api/exchange-rate - USD to CAD rate
  - Both Helius and Covalent API keys configured
  - Sample data generation for demonstration

- **Frontend (React)**:
  - Terminal-themed dashboard with JetBrains Mono font
  - Scanline overlay effect for authentic terminal look
  - Stats bar: Total Volume, Largest Move, Solana TXs, Base TXs
  - Network filter tabs (ALL, SOLANA, BASE)
  - Scrolling transaction list with Token Name, CAD Amount, Explorer Link
  - Subscribe modal for email alerts
  - Auto-refresh every 30 seconds with LIVE indicator
  - **Sound notifications toggle** for new whale moves
  - **NEW badge** highlighting fresh transactions
  - Responsive design for mobile/desktop

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Transaction list display
- [x] Network filtering
- [x] CAD amount display
- [x] Explorer links
- [x] Subscribe button/modal
- [x] Sound notifications

### P1 - High Priority (For Future)
- [ ] Actual email sending for alerts (SendGrid integration)
- [ ] WebSocket for real-time updates instead of polling
- [ ] Historical data storage and charts

### P2 - Nice to Have
- [ ] Price alerts threshold customization
- [ ] Multiple threshold tiers (100K, 500K, 1M)
- [ ] Transaction history export (CSV)
- [ ] Mobile PWA support

## Architecture
```
Frontend (React + TailwindCSS)
    |
    v
Backend (FastAPI)
    |
    +---> Helius API (Solana) ✓
    +---> Covalent API (Base) ✓
    +---> MongoDB (Email subscriptions)
```

## Tech Stack
- Frontend: React 19, TailwindCSS, Lucide Icons
- Backend: FastAPI, httpx, Motor (MongoDB async)
- Database: MongoDB
- APIs: Helius (Solana), Covalent (Base)

## Next Tasks
1. Add SendGrid integration for actual email alerts
2. Consider WebSocket for true real-time updates
3. Add threshold customization options
