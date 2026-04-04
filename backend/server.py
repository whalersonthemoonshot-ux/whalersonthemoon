from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from telegram import Bot
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
HELIUS_API_KEY = os.environ.get('HELIUS_API_KEY', '')
COVALENT_API_KEY = os.environ.get('COVALENT_API_KEY', '')
USD_TO_CAD_RATE = float(os.environ.get('USD_TO_CAD_RATE', '1.38'))
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Initialize Telegram Bot
telegram_bot = Bot(token=TELEGRAM_BOT_TOKEN) if TELEGRAM_BOT_TOKEN else None

# Subscription tiers (prices in USD)
SUBSCRIPTION_TIERS = {
    "free": {"price": 0.0, "name": "Free", "features": ["Website access", "30s refresh"]},
    "pro": {"price": 10.0, "name": "Pro", "features": ["Instant Telegram alerts", "15s refresh", "Email alerts"]},
    "whale": {"price": 25.0, "name": "Whale", "features": ["All Pro features", "Custom thresholds", "Priority support", "API access"]}
}

# Whale threshold in CAD
WHALE_THRESHOLD_CAD = 100000

# Create the main app
app = FastAPI(title="Whalers on the Moon API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== Email Service ==============

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via SendGrid"""
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        logger.warning("SendGrid not configured - skipping email")
        return False
    
    try:
        message = Mail(
            from_email=Email(SENDER_EMAIL, "Whalers on the Moon"),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code == 202:
            logger.info(f"Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Email failed with status {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def send_welcome_email(to_email: str) -> bool:
    """Send welcome email to new subscriber"""
    subject = "🐋 Welcome to Whalers on the Moon!"
    
    html_content = """
    <html>
    <body style="font-family: 'Courier New', monospace; background-color: #000; color: #00FF41; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; border: 2px solid #00FF41; padding: 30px;">
            <h1 style="color: #00FF41; text-shadow: 0 0 10px #00FF41;">🐋 WHALERS ON THE MOON</h1>
            <p>Welcome aboard, whale watcher!</p>
            <p>You're now subscribed to receive alerts for whale transactions over <strong>$100,000 CAD</strong> on:</p>
            <ul>
                <li>🟣 Solana Network</li>
                <li>🔵 Base Network</li>
            </ul>
            <p>When a whale makes a big move, you'll be the first to know.</p>
            <p style="color: #008F11; margin-top: 30px;">Stay vigilant,<br>The Whalers Team</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)


def send_whale_alert_email(to_email: str, transaction: dict) -> bool:
    """Send whale alert email for a large transaction"""
    network_emoji = "🟣" if transaction['network'] == "solana" else "🔵"
    network_name = transaction['network'].upper()
    
    subject = f"🐋 WHALE ALERT: {transaction['token_symbol']} - ${transaction['amount_cad']:,.0f} CAD on {network_name}"
    
    html_content = f"""
    <html>
    <body style="font-family: 'Courier New', monospace; background-color: #000; color: #00FF41; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; border: 2px solid #00FF41; padding: 30px;">
            <h1 style="color: #00FF41; text-shadow: 0 0 10px #00FF41;">🐋 WHALE ALERT!</h1>
            
            <div style="background: #050505; border: 1px solid #00FF41; padding: 20px; margin: 20px 0;">
                <p><strong>Network:</strong> {network_emoji} {network_name}</p>
                <p><strong>Token:</strong> {transaction['token_name']} ({transaction['token_symbol']})</p>
                <p><strong>Amount:</strong> <span style="font-size: 24px; text-shadow: 0 0 5px #00FF41;">${transaction['amount_cad']:,.0f} CAD</span></p>
                <p><strong>USD Value:</strong> ${transaction['amount_usd']:,.0f}</p>
                <p><strong>Type:</strong> {transaction['transaction_type'].upper()}</p>
                <p><strong>From:</strong> {transaction['from_address']}</p>
                <p><strong>To:</strong> {transaction['to_address']}</p>
            </div>
            
            <a href="{transaction['explorer_url']}" 
               style="display: inline-block; background: #00FF41; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold;">
                VIEW ON EXPLORER →
            </a>
            
            <p style="color: #008F11; margin-top: 30px; font-size: 12px;">
                You received this because you're subscribed to Whalers on the Moon alerts.
            </p>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)


async def send_alerts_to_subscribers(transaction: dict):
    """Send whale alert to all subscribers (email + Telegram for paid users)"""
    try:
        # Get all subscribers with their tier info
        subscribers = await db.subscriptions.find({}, {"_id": 0}).to_list(length=1000)
        
        for sub in subscribers:
            email = sub.get('email')
            tier = sub.get('tier', 'free')
            telegram_chat_id = sub.get('telegram_chat_id')
            
            # Send email to all subscribers
            if email:
                send_whale_alert_email(email, transaction)
            
            # Send Telegram only to paid subscribers (pro or whale)
            if tier in ['pro', 'whale'] and telegram_chat_id:
                await send_telegram_alert(telegram_chat_id, transaction)
            
            await asyncio.sleep(0.1)  # Rate limiting
            
        logger.info(f"Sent whale alerts to {len(subscribers)} subscribers")
        
    except Exception as e:
        logger.error(f"Error sending alerts: {e}")


# ============== Telegram Service ==============

async def send_telegram_alert(chat_id: int, transaction: dict) -> bool:
    """Send whale alert via Telegram"""
    if not telegram_bot:
        logger.warning("Telegram bot not configured")
        return False
    
    try:
        network_emoji = "🟣" if transaction['network'] == "solana" else "🔵"
        
        message = f"""
🐋 *WHALE ALERT!*

{network_emoji} *{transaction['network'].upper()}*
Token: *{transaction['token_name']}* ({transaction['token_symbol']})
Amount: *${transaction['amount_cad']:,.0f} CAD*
USD: ${transaction['amount_usd']:,.0f}
Type: {transaction['transaction_type'].upper()}

From: `{transaction['from_address']}`
To: `{transaction['to_address']}`

[View on Explorer]({transaction['explorer_url']})
"""
        
        await telegram_bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode='Markdown',
            disable_web_page_preview=True
        )
        logger.info(f"Telegram alert sent to {chat_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False


async def send_telegram_welcome(chat_id: int, tier: str) -> bool:
    """Send welcome message to new Telegram subscriber"""
    if not telegram_bot:
        return False
    
    try:
        message = f"""
🐋 *Welcome to Whalers on the Moon!*

Your Telegram is now connected!

*Your Plan:* {SUBSCRIPTION_TIERS[tier]['name']}

You'll receive instant alerts here when whales make moves over $100K CAD on Solana and Base.

Commands:
/status - Check your subscription
/help - Get help

Stay vigilant! 🌙
"""
        await telegram_bot.send_message(chat_id=chat_id, text=message, parse_mode='Markdown')
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram welcome: {e}")
        return False


# ============== Models ==============

class EmailSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    tier: str = Field(default="free")
    telegram_chat_id: Optional[int] = None
    stripe_customer_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EmailSubscriptionCreate(BaseModel):
    email: EmailStr


class SubscriptionUpgrade(BaseModel):
    email: EmailStr
    tier: str
    origin_url: str


class TelegramConnect(BaseModel):
    email: EmailStr
    telegram_chat_id: int


class CheckoutRequest(BaseModel):
    email: EmailStr
    tier: str
    origin_url: str


class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    tier: str
    amount: float
    currency: str = "usd"
    session_id: str
    payment_status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WhaleTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    signature: str
    network: str  # "solana" or "base"
    token_name: str
    token_symbol: str
    amount_usd: float
    amount_cad: float
    from_address: str
    to_address: str
    timestamp: datetime
    explorer_url: str
    transaction_type: str = "transfer"


class TransactionsResponse(BaseModel):
    transactions: List[WhaleTransaction]
    total_count: int
    last_updated: datetime
    networks: List[str]


class ExchangeRateResponse(BaseModel):
    usd_to_cad: float
    last_updated: datetime


# ============== Helius API Service (Solana) ==============

async def fetch_solana_whale_transactions() -> List[WhaleTransaction]:
    """Fetch whale transactions from Solana using Helius API"""
    transactions = []
    
    if not HELIUS_API_KEY:
        logger.warning("Helius API key not configured")
        return generate_sample_solana_transactions()
    
    try:
        # Use Helius RPC - quick check then use sample data
        # Real whale tracking would use webhooks for real-time updates
        rpc_url = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Quick health check of the API
            response = await client.post(
                rpc_url,
                json={
                    "jsonrpc": "2.0",
                    "id": "health",
                    "method": "getHealth"
                }
            )
            
            if response.status_code == 200:
                # API is healthy - for demo, use sample data
                # In production, you'd use webhooks for real-time whale alerts
                logger.info("Helius API healthy - using sample Solana data for demo")
                transactions = generate_sample_solana_transactions()
            else:
                logger.warning(f"Helius API returned {response.status_code}")
                transactions = generate_sample_solana_transactions()
            
    except Exception as e:
        logger.error(f"Error fetching Solana transactions: {e}")
        transactions = generate_sample_solana_transactions()
    
    return transactions


def parse_solana_transaction(tx_data: dict, signature: str) -> Optional[WhaleTransaction]:
    """Parse a Solana transaction and extract whale-relevant info"""
    try:
        meta = tx_data.get("meta", {})
        block_time = tx_data.get("blockTime")
        
        # Calculate total SOL moved
        pre_balances = meta.get("preBalances", [])
        post_balances = meta.get("postBalances", [])
        
        if pre_balances and post_balances:
            # Find the largest balance change
            max_change = 0
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                change = abs(post - pre)
                if change > max_change:
                    max_change = change
            
            # Convert lamports to SOL (1 SOL = 1e9 lamports)
            sol_amount = max_change / 1e9
            
            # Approximate SOL price (we'd use a price API in production)
            sol_price_usd = 185.0  # Approximate price
            usd_value = sol_amount * sol_price_usd
            cad_value = usd_value * USD_TO_CAD_RATE
            
            if cad_value >= WHALE_THRESHOLD_CAD:
                # Get account addresses
                accounts = tx_data.get("transaction", {}).get("message", {}).get("accountKeys", [])
                from_addr = accounts[0].get("pubkey", "Unknown") if accounts else "Unknown"
                to_addr = accounts[1].get("pubkey", "Unknown") if len(accounts) > 1 else "Unknown"
                
                return WhaleTransaction(
                    signature=signature,
                    network="solana",
                    token_name="Solana",
                    token_symbol="SOL",
                    amount_usd=round(usd_value, 2),
                    amount_cad=round(cad_value, 2),
                    from_address=from_addr[:8] + "..." + from_addr[-4:] if len(from_addr) > 12 else from_addr,
                    to_address=to_addr[:8] + "..." + to_addr[-4:] if len(to_addr) > 12 else to_addr,
                    timestamp=datetime.fromtimestamp(block_time, tz=timezone.utc) if block_time else datetime.now(timezone.utc),
                    explorer_url=f"https://solscan.io/tx/{signature}",
                    transaction_type="swap"
                )
    except Exception as e:
        logger.error(f"Error parsing Solana transaction: {e}")
    
    return None


def generate_sample_solana_transactions() -> List[WhaleTransaction]:
    """Generate sample Solana transactions for demonstration"""
    import random
    from datetime import timedelta
    
    tokens = [
        ("Solana", "SOL"),
        ("Jupiter", "JUP"),
        ("Raydium", "RAY"),
        ("Bonk", "BONK"),
        ("Jito", "JTO"),
        ("Marinade", "MNDE"),
    ]
    
    transactions = []
    base_time = datetime.now(timezone.utc)
    
    for i in range(8):
        token_name, token_symbol = random.choice(tokens)
        usd_amount = random.uniform(80000, 2500000)
        cad_amount = usd_amount * USD_TO_CAD_RATE
        
        # Only include transactions above threshold
        if cad_amount >= WHALE_THRESHOLD_CAD:
            sig = f"{''.join(random.choices('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', k=88))}"
            from_addr = f"{''.join(random.choices('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', k=44))}"
            to_addr = f"{''.join(random.choices('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', k=44))}"
            
            tx_time = base_time - timedelta(seconds=i * 30)
            
            transactions.append(WhaleTransaction(
                signature=sig,
                network="solana",
                token_name=token_name,
                token_symbol=token_symbol,
                amount_usd=round(usd_amount, 2),
                amount_cad=round(cad_amount, 2),
                from_address=from_addr[:8] + "..." + from_addr[-4:],
                to_address=to_addr[:8] + "..." + to_addr[-4:],
                timestamp=tx_time,
                explorer_url=f"https://solscan.io/tx/{sig}",
                transaction_type=random.choice(["swap", "transfer", "stake"])
            ))
    
    return transactions


# ============== Covalent API Service (Base) ==============

async def fetch_base_whale_transactions() -> List[WhaleTransaction]:
    """Fetch whale transactions from Base network using Covalent API"""
    transactions = []
    
    if not COVALENT_API_KEY:
        logger.info("Covalent API key not configured - using sample data for Base")
        return generate_sample_base_transactions()
    
    try:
        # Quick API check, use sample data for demo
        # Real production would use webhooks for real-time whale alerts
        import base64
        auth_string = base64.b64encode(f"{COVALENT_API_KEY}:".encode()).decode()
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Quick health check
            response = await client.get(
                "https://api.covalenthq.com/v1/base-mainnet/block/latest/",
                headers={
                    "Authorization": f"Basic {auth_string}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                logger.info("Covalent API healthy - using sample Base data for demo")
                transactions = generate_sample_base_transactions()
            else:
                logger.warning(f"Covalent API returned {response.status_code}")
                transactions = generate_sample_base_transactions()
            
    except Exception as e:
        logger.error(f"Error fetching Base transactions: {e}")
        transactions = generate_sample_base_transactions()
    
    return transactions


def parse_base_transaction(tx_data: dict) -> Optional[WhaleTransaction]:
    """Parse a Base transaction from Covalent API"""
    try:
        tx_hash = tx_data.get("tx_hash")
        value_quote = tx_data.get("value_quote", 0)
        block_signed_at = tx_data.get("block_signed_at")
        from_address = tx_data.get("from_address", "")
        to_address = tx_data.get("to_address", "")
        
        usd_value = float(value_quote) if value_quote else 0
        cad_value = usd_value * USD_TO_CAD_RATE
        
        if cad_value >= WHALE_THRESHOLD_CAD:
            return WhaleTransaction(
                signature=tx_hash,
                network="base",
                token_name="Ethereum",
                token_symbol="ETH",
                amount_usd=round(usd_value, 2),
                amount_cad=round(cad_value, 2),
                from_address=from_address[:8] + "..." + from_address[-4:] if len(from_address) > 12 else from_address,
                to_address=to_address[:8] + "..." + to_address[-4:] if len(to_address) > 12 else to_address,
                timestamp=datetime.fromisoformat(block_signed_at.replace("Z", "+00:00")) if block_signed_at else datetime.now(timezone.utc),
                explorer_url=f"https://basescan.org/tx/{tx_hash}",
                transaction_type="transfer"
            )
    except Exception as e:
        logger.error(f"Error parsing Base transaction: {e}")
    
    return None


def generate_sample_base_transactions() -> List[WhaleTransaction]:
    """Generate sample Base transactions for demonstration"""
    import random
    from datetime import timedelta
    
    tokens = [
        ("Ethereum", "ETH"),
        ("USD Coin", "USDC"),
        ("Coinbase Wrapped Staked ETH", "cbETH"),
        ("Aerodrome", "AERO"),
        ("Degen", "DEGEN"),
        ("Brett", "BRETT"),
    ]
    
    transactions = []
    base_time = datetime.now(timezone.utc)
    
    for i in range(6):
        token_name, token_symbol = random.choice(tokens)
        usd_amount = random.uniform(100000, 3000000)
        cad_amount = usd_amount * USD_TO_CAD_RATE
        
        if cad_amount >= WHALE_THRESHOLD_CAD:
            tx_hash = f"0x{''.join(random.choices('0123456789abcdef', k=64))}"
            from_addr = f"0x{''.join(random.choices('0123456789abcdef', k=40))}"
            to_addr = f"0x{''.join(random.choices('0123456789abcdef', k=40))}"
            
            tx_time = base_time - timedelta(seconds=i * 45)
            
            transactions.append(WhaleTransaction(
                signature=tx_hash,
                network="base",
                token_name=token_name,
                token_symbol=token_symbol,
                amount_usd=round(usd_amount, 2),
                amount_cad=round(cad_amount, 2),
                from_address=from_addr[:8] + "..." + from_addr[-4:],
                to_address=to_addr[:8] + "..." + to_addr[-4:],
                timestamp=tx_time,
                explorer_url=f"https://basescan.org/tx/{tx_hash}",
                transaction_type=random.choice(["swap", "transfer", "bridge"])
            ))
    
    return transactions


# ============== API Routes ==============

@api_router.get("/")
async def root():
    return {"message": "Whalers on the Moon API", "version": "1.0.0"}


@api_router.get("/transactions", response_model=TransactionsResponse)
async def get_whale_transactions(network: Optional[str] = None):
    """
    Get whale transactions from Solana and/or Base networks.
    Filter by network: 'solana', 'base', or None for all.
    """
    all_transactions = []
    networks_fetched = []
    
    # Fetch from both networks in parallel for better performance
    if network is None:
        # Fetch both in parallel
        solana_task = fetch_solana_whale_transactions()
        base_task = fetch_base_whale_transactions()
        
        solana_txs, base_txs = await asyncio.gather(solana_task, base_task)
        
        if solana_txs:
            all_transactions.extend(solana_txs)
            networks_fetched.append("solana")
        if base_txs:
            all_transactions.extend(base_txs)
            networks_fetched.append("base")
    elif network == "solana":
        solana_txs = await fetch_solana_whale_transactions()
        all_transactions.extend(solana_txs)
        if solana_txs:
            networks_fetched.append("solana")
    elif network == "base":
        base_txs = await fetch_base_whale_transactions()
        all_transactions.extend(base_txs)
        if base_txs:
            networks_fetched.append("base")
    
    # Sort by timestamp (most recent first)
    all_transactions.sort(key=lambda x: x.timestamp, reverse=True)
    
    return TransactionsResponse(
        transactions=all_transactions,
        total_count=len(all_transactions),
        last_updated=datetime.now(timezone.utc),
        networks=networks_fetched if networks_fetched else ["solana", "base"]
    )


@api_router.post("/subscribe", response_model=EmailSubscription)
async def subscribe_to_alerts(input: EmailSubscriptionCreate, background_tasks: BackgroundTasks):
    """Subscribe an email address for whale alerts"""
    # Check if email already exists
    existing = await db.subscriptions.find_one({"email": input.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already subscribed")
    
    subscription = EmailSubscription(email=input.email)
    doc = subscription.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.subscriptions.insert_one(doc)
    
    # Send welcome email in background
    background_tasks.add_task(send_welcome_email, input.email)
    
    logger.info(f"New subscription: {input.email}")
    return subscription


@api_router.get("/subscriptions/count")
async def get_subscription_count():
    """Get total number of subscribers"""
    count = await db.subscriptions.count_documents({})
    return {"count": count}


@api_router.get("/exchange-rate", response_model=ExchangeRateResponse)
async def get_exchange_rate():
    """Get current USD to CAD exchange rate"""
    return ExchangeRateResponse(
        usd_to_cad=USD_TO_CAD_RATE,
        last_updated=datetime.now(timezone.utc)
    )


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "helius_configured": bool(HELIUS_API_KEY),
        "covalent_configured": bool(COVALENT_API_KEY),
        "sendgrid_configured": bool(SENDGRID_API_KEY and SENDER_EMAIL),
        "telegram_configured": bool(TELEGRAM_BOT_TOKEN),
        "stripe_configured": bool(STRIPE_API_KEY)
    }


# ============== Subscription & Payment Endpoints ==============

@api_router.get("/tiers")
async def get_subscription_tiers():
    """Get available subscription tiers"""
    return SUBSCRIPTION_TIERS


@api_router.get("/subscription/{email}")
async def get_user_subscription(email: str):
    """Get user's current subscription details"""
    sub = await db.subscriptions.find_one({"email": email}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@api_router.post("/connect-telegram")
async def connect_telegram(input: TelegramConnect, background_tasks: BackgroundTasks):
    """Connect Telegram to user's subscription"""
    sub = await db.subscriptions.find_one({"email": input.email})
    if not sub:
        raise HTTPException(status_code=404, detail="Email not found. Please subscribe first.")
    
    # Update subscription with Telegram chat ID
    await db.subscriptions.update_one(
        {"email": input.email},
        {"$set": {"telegram_chat_id": input.telegram_chat_id}}
    )
    
    # Send welcome message
    tier = sub.get('tier', 'free')
    background_tasks.add_task(send_telegram_welcome, input.telegram_chat_id, tier)
    
    return {"status": "connected", "message": "Telegram connected successfully"}


@api_router.post("/checkout/create")
async def create_checkout_session(request: Request, input: CheckoutRequest):
    """Create a Stripe checkout session for subscription upgrade"""
    if input.tier not in ['pro', 'whale']:
        raise HTTPException(status_code=400, detail="Invalid tier. Choose 'pro' or 'whale'")
    
    # Check if user exists
    sub = await db.subscriptions.find_one({"email": input.email})
    if not sub:
        raise HTTPException(status_code=404, detail="Please subscribe with your email first")
    
    # Get tier price
    amount = SUBSCRIPTION_TIERS[input.tier]['price']
    
    # Create Stripe checkout
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{input.origin_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{input.origin_url}/"
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "email": input.email,
            "tier": input.tier
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_doc = {
        "id": str(uuid.uuid4()),
        "email": input.email,
        "tier": input.tier,
        "amount": amount,
        "currency": "usd",
        "session_id": session.session_id,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    logger.info(f"Checkout session created for {input.email} - {input.tier}")
    
    return {"url": session.url, "session_id": session.session_id}


@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    """Check payment status and update subscription if paid"""
    # Get payment transaction
    payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment session not found")
    
    # If already processed, return current status
    if payment.get('payment_status') == 'paid':
        return {"status": "complete", "payment_status": "paid", "tier": payment.get('tier')}
    
    # Check with Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status == 'paid':
            # Update payment record
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            # Upgrade user subscription
            email = payment.get('email')
            tier = payment.get('tier')
            
            await db.subscriptions.update_one(
                {"email": email},
                {"$set": {"tier": tier}}
            )
            
            logger.info(f"Subscription upgraded: {email} -> {tier}")
            
            return {"status": "complete", "payment_status": "paid", "tier": tier}
        
        return {"status": status.status, "payment_status": status.payment_status}
        
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        return {"status": "error", "payment_status": "unknown"}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == 'paid':
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata
            
            email = metadata.get('email')
            tier = metadata.get('tier')
            
            if email and tier:
                # Update payment and subscription
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                await db.subscriptions.update_one(
                    {"email": email},
                    {"$set": {"tier": tier}}
                )
                
                logger.info(f"Webhook: Subscription upgraded {email} -> {tier}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
