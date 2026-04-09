"""
Real Whale Transaction Fetcher
Fetches and stores real whale transactions from Solana and Base
"""
import asyncio
import logging
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
from dotenv import load_dotenv
from pathlib import Path
import base64

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Config
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
HELIUS_API_KEY = os.environ.get('HELIUS_API_KEY', '')
COVALENT_API_KEY = os.environ.get('COVALENT_API_KEY', '')
USD_TO_CAD_RATE = float(os.environ.get('USD_TO_CAD_RATE', '1.38'))
WHALE_THRESHOLD_USD = 50000  # ~$70K CAD - lower to find more transactions

# MongoDB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Known high-value addresses to monitor
SOLANA_WHALE_PROGRAMS = [
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",  # Jupiter v6
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",  # Orca Whirlpool
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",  # Raydium
]

BASE_WHALE_ADDRESSES = [
    "0x2626664c2603336E57B271c5C0b26F421741e481",  # Uniswap V3 Router
    "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",  # Aerodrome Router
]

# Token prices (approximate - in production use a price API)
TOKEN_PRICES_USD = {
    "SOL": 180,
    "ETH": 3500,
    "USDC": 1,
    "USDT": 1,
    "JUP": 1.2,
    "RAY": 2.5,
    "BONK": 0.00002,
    "WIF": 2.8,
    "AERO": 1.5,
}


async def fetch_solana_whales():
    """Fetch large transactions from Solana via Helius Enhanced API"""
    if not HELIUS_API_KEY:
        logger.warning("No Helius API key")
        return []
    
    transactions = []
    
    # USDC and USDT mints on Solana
    USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    SOL_MINT = "So11111111111111111111111111111111111111112"
    
    enhanced_url = f"https://api.helius.xyz/v0/addresses/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4/transactions?api-key={HELIUS_API_KEY}&limit=100"
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            logger.info("Fetching Solana enhanced transactions...")
            response = await http_client.get(enhanced_url)
            
            if response.status_code != 200:
                logger.error(f"Helius enhanced API error: {response.status_code}")
                return []
            
            txs = response.json()
            logger.info(f"Got {len(txs)} Solana transactions")
            
            for tx in txs:
                sig = tx.get("signature")
                if not sig:
                    continue
                
                # Check if we already have this
                existing = await db.whale_transactions.find_one({"signature": sig})
                if existing:
                    continue
                
                token_transfers = tx.get("tokenTransfers", [])
                max_usd = 0
                token_name = "Unknown"
                token_symbol = "???"
                
                for tt in token_transfers:
                    amount = tt.get("tokenAmount")
                    if amount is None:
                        continue
                    
                    mint = tt.get("mint", "")
                    
                    # Check for stablecoins (already in USD)
                    if mint == USDC_MINT:
                        usd = float(amount)
                        if usd > max_usd:
                            max_usd = usd
                            token_name = "USD Coin"
                            token_symbol = "USDC"
                    elif mint == USDT_MINT:
                        usd = float(amount)
                        if usd > max_usd:
                            max_usd = usd
                            token_name = "Tether"
                            token_symbol = "USDT"
                    elif mint == SOL_MINT:
                        usd = float(amount) * 180  # SOL price estimate
                        if usd > max_usd:
                            max_usd = usd
                            token_name = "Solana"
                            token_symbol = "SOL"
                
                # Store transactions over $100
                if max_usd >= 100:
                    whale_tx = {
                        "signature": sig,
                        "network": "solana",
                        "token_name": token_name,
                        "token_symbol": token_symbol,
                        "amount_usd": round(max_usd, 2),
                        "amount_cad": round(max_usd * USD_TO_CAD_RATE, 2),
                        "from_address": tx.get("feePayer", "")[:8] + "..." if tx.get("feePayer") else "",
                        "to_address": "",
                        "timestamp": datetime.fromtimestamp(tx.get("timestamp", 0), tz=timezone.utc).isoformat() if tx.get("timestamp") else datetime.now(timezone.utc).isoformat(),
                        "explorer_url": f"https://solscan.io/tx/{sig}",
                        "transaction_type": tx.get("type", "SWAP"),
                        "fetched_at": datetime.now(timezone.utc).isoformat()
                    }
                    transactions.append(whale_tx)
                    logger.info(f"Found tx: ${max_usd:,.0f} {token_symbol}")
                    
        except Exception as e:
            logger.error(f"Error fetching Solana: {e}")
    
    return transactions


def parse_solana_tx(tx_data: dict, signature: str) -> dict:
    """Parse a Solana transaction for whale activity"""
    try:
        meta = tx_data.get("meta", {})
        block_time = tx_data.get("blockTime")
        
        # Calculate SOL moved
        pre_balances = meta.get("preBalances", [])
        post_balances = meta.get("postBalances", [])
        
        max_sol_moved = 0
        if pre_balances and post_balances:
            for pre, post in zip(pre_balances, post_balances):
                change = abs(post - pre) / 1e9  # lamports to SOL
                if change > max_sol_moved:
                    max_sol_moved = change
        
        # Check token transfers
        token_transfers = meta.get("postTokenBalances", [])
        pre_token = meta.get("preTokenBalances", [])
        
        max_token_usd = 0
        token_name = "SOL"
        token_symbol = "SOL"
        
        # Estimate SOL value
        sol_usd = max_sol_moved * TOKEN_PRICES_USD.get("SOL", 180)
        
        if sol_usd >= WHALE_THRESHOLD_USD:
            max_token_usd = sol_usd
        
        # Get addresses
        accounts = tx_data.get("transaction", {}).get("message", {}).get("accountKeys", [])
        from_addr = ""
        to_addr = ""
        
        if accounts:
            if isinstance(accounts[0], dict):
                from_addr = accounts[0].get("pubkey", "")[:8] + "..." + accounts[0].get("pubkey", "")[-4:]
                to_addr = accounts[1].get("pubkey", "")[:8] + "..." + accounts[1].get("pubkey", "")[-4:] if len(accounts) > 1 else ""
            else:
                from_addr = accounts[0][:8] + "..." + accounts[0][-4:]
                to_addr = accounts[1][:8] + "..." + accounts[1][-4:] if len(accounts) > 1 else ""
        
        if max_token_usd < WHALE_THRESHOLD_USD:
            return None
        
        return {
            "signature": signature,
            "network": "solana",
            "token_name": token_name,
            "token_symbol": token_symbol,
            "amount_usd": round(max_token_usd, 2),
            "amount_cad": round(max_token_usd * USD_TO_CAD_RATE, 2),
            "from_address": from_addr,
            "to_address": to_addr,
            "timestamp": datetime.fromtimestamp(block_time, tz=timezone.utc).isoformat() if block_time else datetime.now(timezone.utc).isoformat(),
            "explorer_url": f"https://solscan.io/tx/{signature}",
            "transaction_type": "swap",
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Parse error: {e}")
        return None


async def fetch_base_whales():
    """Fetch large transactions from Base via Covalent with retry logic"""
    if not COVALENT_API_KEY:
        logger.warning("No Covalent API key")
        return []
    
    transactions = []
    auth_string = base64.b64encode(f"{COVALENT_API_KEY}:".encode()).decode()
    
    # Retry config
    MAX_RETRIES = 3
    BASE_TIMEOUT = 30.0
    
    async with httpx.AsyncClient() as http_client:
        for address in BASE_WHALE_ADDRESSES:
            retry_count = 0
            success = False
            
            while retry_count < MAX_RETRIES and not success:
                try:
                    # Exponential backoff timeout: 30s, 45s, 60s
                    current_timeout = BASE_TIMEOUT * (1.5 ** retry_count)
                    
                    if retry_count > 0:
                        # Wait before retry with exponential backoff: 2s, 4s, 8s
                        wait_time = 2 ** retry_count
                        logger.info(f"Retry {retry_count}/{MAX_RETRIES} for {address[:10]}... (waiting {wait_time}s)")
                        await asyncio.sleep(wait_time)
                    
                    logger.info(f"Fetching Base transactions for {address[:10]}... (timeout: {current_timeout}s)")
                    
                    response = await http_client.get(
                        f"https://api.covalenthq.com/v1/base-mainnet/address/{address}/transactions_v3/",
                        headers={
                            "Authorization": f"Basic {auth_string}",
                            "Content-Type": "application/json"
                        },
                        params={"page-size": 30},
                        timeout=current_timeout
                    )
                    
                    if response.status_code == 429:
                        # Rate limited - wait longer
                        logger.warning(f"Covalent rate limited, waiting 30s...")
                        await asyncio.sleep(30)
                        retry_count += 1
                        continue
                    
                    if response.status_code != 200:
                        logger.error(f"Covalent error: {response.status_code} - {response.text[:200]}")
                        retry_count += 1
                        continue
                    
                    data = response.json()
                    items = data.get("data", {}).get("items", [])
                    logger.info(f"Got {len(items)} Base transactions")
                    success = True
                    
                    for item in items:
                        tx_hash = item.get("tx_hash")
                        if not tx_hash:
                            continue
                        
                        # Check if we already have this
                        existing = await db.whale_transactions.find_one({"signature": tx_hash})
                        if existing:
                            continue
                        
                        # Get transaction value
                        value_wei = int(item.get("value", 0) or 0)
                        value_eth = value_wei / 1e18
                        value_usd = value_eth * TOKEN_PRICES_USD.get("ETH", 3500)
                        
                        if value_usd >= WHALE_THRESHOLD_USD:
                            from_addr = item.get("from_address", "")
                            to_addr = item.get("to_address", "")
                            
                            whale_tx = {
                                "signature": tx_hash,
                                "network": "base",
                                "token_name": "Ethereum",
                                "token_symbol": "ETH",
                                "amount_usd": round(value_usd, 2),
                                "amount_cad": round(value_usd * USD_TO_CAD_RATE, 2),
                                "from_address": f"{from_addr[:8]}...{from_addr[-4:]}" if from_addr else "",
                                "to_address": f"{to_addr[:8]}...{to_addr[-4:]}" if to_addr else "",
                                "timestamp": item.get("block_signed_at", datetime.now(timezone.utc).isoformat()),
                                "explorer_url": f"https://basescan.org/tx/{tx_hash}",
                                "transaction_type": "transfer",
                                "fetched_at": datetime.now(timezone.utc).isoformat()
                            }
                            transactions.append(whale_tx)
                            logger.info(f"Found Base whale: ${value_usd:,.0f} ETH")
                
                except httpx.TimeoutException:
                    retry_count += 1
                    logger.warning(f"Covalent timeout for {address[:10]}... (attempt {retry_count}/{MAX_RETRIES})")
                except httpx.ConnectError as e:
                    retry_count += 1
                    logger.warning(f"Covalent connection error: {e} (attempt {retry_count}/{MAX_RETRIES})")
                except Exception as e:
                    logger.error(f"Error fetching Base: {e}")
                    retry_count += 1
            
            if not success:
                logger.error(f"Failed to fetch Base transactions for {address[:10]} after {MAX_RETRIES} retries")
    
    return transactions


async def store_transactions(transactions: list):
    """Store whale transactions in MongoDB"""
    if not transactions:
        return
    
    for tx in transactions:
        try:
            # Use upsert to avoid duplicates
            await db.whale_transactions.update_one(
                {"signature": tx["signature"]},
                {"$set": tx},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Store error: {e}")
    
    logger.info(f"Stored {len(transactions)} transactions")


async def run_fetcher():
    """Main fetcher loop"""
    logger.info("Starting whale transaction fetcher...")
    
    while True:
        try:
            # Fetch from both networks
            solana_txs = await fetch_solana_whales()
            base_txs = await fetch_base_whales()
            
            all_txs = solana_txs + base_txs
            
            if all_txs:
                await store_transactions(all_txs)
                logger.info(f"Fetched {len(all_txs)} new whale transactions")
            else:
                logger.info("No new whale transactions found")
            
            # Get current count
            count = await db.whale_transactions.count_documents({})
            logger.info(f"Total stored transactions: {count}")
            
        except Exception as e:
            logger.error(f"Fetcher error: {e}")
        
        # Wait before next fetch (5 minutes)
        await asyncio.sleep(300)


if __name__ == "__main__":
    asyncio.run(run_fetcher())
