# Whalers on the Moon - PRD

## Original Problem Statement
Build a real-time Whale Transaction Tracker for the Solana and Base networks called "Whalers on the Moon".

## Business Model (Updated)
- **Free**: Dashboard access - view whale transactions anytime
- **Premium ($9.99/month USD)**: 3-day free trial, then paid
  - Instant Telegram alerts
  - Priority email alerts  
  - 10-second refresh rate
  - Custom threshold alerts
  - Priority support

## Core Features
- [x] Real-time whale transaction tracking (Solana + Base)
- [x] Terminal-style UI (black background, green text)
- [x] Customizable thresholds ($100 - $10K range)
- [x] Multi-currency display (USD, CAD, EUR, GBP, AUD)
- [x] Sound notifications
- [x] Stripe payment integration with 3-day trial
- [x] Telegram bot alerts (premium)
- [x] Email alerts (premium)
- [x] Legal pages (Privacy, Terms, Disclaimer)

## Architecture
```
Frontend (React)
    |
    v
Backend (FastAPI)
    |
    +---> Helius API (Solana)
    +---> Covalent API (Base) - with retry logic
    +---> MongoDB
    +---> SendGrid (email)
    +---> Stripe (payments)
    +---> Telegram Bot API

Supervisor Processes:
    1. backend (FastAPI server)
    2. whale_fetcher (background data poller)
    3. telegram_bot (Telegram long polling)
```

## Component Structure
```
/app/frontend/src/
├── App.js                  # Main app with routing
├── components/
│   ├── utils.js            # Shared utilities
│   ├── Header.js           
│   ├── ShipBanner.js       # ASCII ship animation
│   ├── StatsBar.js         
│   ├── NetworkTabs.js      
│   ├── TransactionList.js  
│   ├── TransactionRow.js   
│   ├── SubscribeModal.js   # Updated for paid model
│   ├── SettingsModal.js    # Lower thresholds
│   ├── DataNotice.js       # Base network latency notice
│   └── Footer.js           
├── PricingPage.js          # Single tier $9.99/mo + 3-day trial
├── ConnectTelegramPage.js  
├── PrivacyPolicy.js        
├── TermsOfService.js       
└── Disclaimer.js           # Includes data latency notice
```

## Recent Changes (2026-04-09)
- Changed from freemium (Pro $5 / Whale $10) to single Premium tier ($9.99/mo)
- Added 3-day free trial
- Updated pricing page UI for single tier
- Updated subscribe modal to clarify paid alerts
- Lowered threshold options ($100 - $10K instead of $50K - $1M)
- Added data latency disclaimer for Base network

## Prioritized Backlog

### Done
- [x] All core features
- [x] Legal compliance pages
- [x] Covalent retry logic
- [x] Code refactoring
- [x] New pricing model

### Future (P2)
- [ ] WebSocket for real-time updates
- [ ] Historical data charts
- [ ] Transaction export (CSV)
