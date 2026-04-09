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
- [x] Email subscription for alerts (SendGrid)
- [x] Auto-refresh every 30 seconds
- [x] Sound notifications for new whale moves
- [x] Telegram Bot alerts (paid subscription via Stripe)
- [x] Legal/Compliance pages (Privacy Policy, Terms of Service, Disclaimer)

## What's Been Implemented

### Date: 2026-04-09
- **Legal Pages Added**:
  - `/privacy` - Privacy Policy (required by Stripe)
  - `/terms` - Terms of Service
  - `/disclaimer` - "Not Financial Advice" disclaimer (crypto regulatory protection)
  - Footer links to all legal pages on main dashboard
  - Terminal-themed styling consistent with app

- **Covalent API Reliability Improved**:
  - Added retry logic with exponential backoff (3 retries)
  - Timeout increases: 30s → 45s → 67.5s
  - Wait times between retries: 2s → 4s → 8s
  - Rate limit handling (429 responses)
  - Better error logging

- **App.js Refactored** (~785 lines → ~220 lines):
  - Extracted `Header.js` - App header with buttons
  - Extracted `ShipBanner.js` - ASCII whaling ship animation
  - Extracted `StatsBar.js` - Stats cards component
  - Extracted `NetworkTabs.js` - Network filter tabs
  - Extracted `TransactionList.js` - Main transaction display
  - Extracted `TransactionRow.js` - Individual transaction row
  - Extracted `SubscribeModal.js` - Email subscription modal
  - Extracted `SettingsModal.js` - Settings configuration modal
  - Extracted `Footer.js` - Footer with legal links
  - Extracted `utils.js` - Shared utilities and constants

### Previous Implementation
- **Backend (FastAPI)**:
  - GET /api/transactions - Fetches whale transactions from MongoDB
  - POST /api/subscribe - Email subscription (SendGrid)
  - POST /api/create-checkout-session - Stripe checkout
  - POST /api/generate-telegram-code - Connect flow
  - POST /api/telegram/connect - Verify Telegram connection
  - GET /api/health - Health check
  - Background worker (whale_fetcher.py) - Polls Helius/Covalent APIs
  - Telegram Bot (telegram_bot.py) - Sends premium alerts

- **Frontend (React)**:
  - Terminal-themed dashboard with JetBrains Mono font
  - ASCII whaling ship animation header
  - Stats bar: Total Volume, Largest Move, Solana TXs, Base TXs
  - Network filter tabs (ALL, SOLANA, BASE)
  - Settings modal (threshold, currency, refresh interval)
  - Subscribe modal for email alerts
  - Pricing page with Stripe integration
  - Telegram connect flow page
  - Sound notifications toggle
  - LocalStorage persistence for settings

## Architecture
```
Frontend (React)
    |
    v
Backend (FastAPI)
    |
    +---> Helius API (Solana) ✓
    +---> Covalent API (Base) ✓ (with retry logic)
    +---> MongoDB (transactions, subscriptions)
    +---> SendGrid (email alerts)
    +---> Stripe (payments)
    +---> Telegram Bot API (premium alerts)

Supervisor Processes:
    1. backend (FastAPI server)
    2. whale_fetcher (background data poller)
    3. telegram_bot (Telegram long polling)
```

## Component Structure (Post-Refactor)
```
/app/frontend/src/
├── App.js                  # Main app with routing (~220 lines)
├── App.css                 # Styles
├── components/
│   ├── utils.js            # Shared utilities & constants
│   ├── Header.js           # App header
│   ├── ShipBanner.js       # ASCII ship animation
│   ├── StatsBar.js         # Stats cards
│   ├── NetworkTabs.js      # Network filter
│   ├── TransactionList.js  # Transaction display
│   ├── TransactionRow.js   # Single transaction row
│   ├── SubscribeModal.js   # Email subscription
│   ├── SettingsModal.js    # Settings configuration
│   └── Footer.js           # Footer with legal links
├── PrivacyPolicy.js        # Legal page
├── TermsOfService.js       # Legal page
├── Disclaimer.js           # Legal page
├── LegalPages.css          # Legal pages styling
├── PricingPage.js          # Stripe checkout
└── ConnectTelegramPage.js  # Telegram connect flow
```

## Tech Stack
- Frontend: React 19, TailwindCSS, Lucide Icons, React Router
- Backend: FastAPI, httpx, Motor (MongoDB async)
- Database: MongoDB
- APIs: Helius (Solana), Covalent (Base), SendGrid, Stripe, Telegram

## Prioritized Backlog

### P0 - Critical (DONE)
- [x] Transaction list display
- [x] Network filtering
- [x] CAD amount display
- [x] Explorer links
- [x] Subscribe button/modal
- [x] Sound notifications
- [x] SendGrid email integration
- [x] Stripe payment integration
- [x] Telegram Bot integration
- [x] Real on-chain data (Helius + Covalent)
- [x] Legal pages (Privacy, Terms, Disclaimer)
- [x] Covalent API retry logic
- [x] Code refactoring (App.js → components)

### P1 - High Priority (Future)
- [ ] WebSocket for real-time updates instead of polling
- [ ] Historical data storage and charts

### P2 - Nice to Have
- [ ] Transaction history export (CSV)
- [ ] Mobile PWA support
- [ ] Cookie consent banner (GDPR)

## Files Reference
- `/app/backend/server.py` - Main FastAPI server
- `/app/backend/whale_fetcher.py` - Background data poller (with retry logic)
- `/app/backend/telegram_bot.py` - Telegram bot script
- `/app/frontend/src/App.js` - Main app (refactored)
- `/app/frontend/src/components/` - Extracted components
