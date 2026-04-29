"""
Real Whale Transaction Fetcher (Multi-Chain Upgrade)
Fetches and stores whale transactions from Solana and 6+ EVM networks
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
WHALE_THRESHOLD_USD = 50000 

# Multi-Chain Config
SUPPORTED_EVM_NETWORKS = {
    "ethereum": {"id": "eth-mainnet", "explorer": "https://etherscan.io/tx/"},
    "base": {"id": "base-mainnet", "explorer": "https://basescan.org/tx/"},
    "polygon": {"id": "matic-mainnet", "explorer": "https://polygonscan.com/tx/"},
    "arbitrum": {"id": "arbitrum-mainnet", "explorer": "https://arbiscan.io/tx/"},
    "optimism": {"id": "optimism-mainnet", "explorer": "https://optimistic.etherscan.io/tx/"},
    "avalanche": {"id": "avalanche-mainnet", "explorer": "https://snowtrace.io/tx/"}
}

# Major Router addresses to monitor for whale swaps
EVM_MONITOR_ADDRESSES = [
    "0x3fC91A3afd003651432c01E9BA9f5965c2B96173", # Uniswap Universal Router (Multiple Chains)
    "0x2626664c2603336E57B271c5C0b26F421741e481", # Uniswap V3 (Base/Eth)
    "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24", # Aerodrome (Base)
    "0x1111111254EEB253931C04051d167Ba218935064", # 1inch (Multi-chain)
]

# MongoDB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# [Keep your fetch_solana_whales() function here exactly as it was]

async def fetch_evm_whales(network_key, config):
    """Fetch large transactions for a specific EVM network via Covalent"""
    if not COVALENT_API_KEY:
        return []
    
    transactions = []
    chain_id = config["id"]
    explorer_base = config["explorer"]
    auth_string = base64.b64encode(f"{COVALENT_API_KEY}:".encode()).decode()
    
    async with httpx.AsyncClient() as http_client:
        for address in EVM_MONITOR_ADDRESSES:
            try:
                logger.info(f"Fetching {network_key.upper()} transactions for {address[:10]}...")
                
                response = await http_client.get(
                    f"https://api.covalenthq.com/v1/{chain_id}/address/{address}/transactions_v3/",
                    headers={"Authorization": f"Basic {auth_string}"},
                    params={"page-size": 20},
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    continue
                
                data = response.json()
                items = data.get("data", {}).get("items", [])
                
                for item in items:
                    tx_hash = item.get("tx_hash")
                    if not tx_hash: continue
                    
                    # Already handled?
                    if await db.whale_transactions.find_one({"signature": tx_hash}):
                        continue
                    
                    # Simplified Value check (ETH/Native)
                    value_usd = (int(item.get("value", 0) or 0) / 1e18) * 3500 # Use price API later
                    
                    if value_usd >= WHALE_THRESHOLD_USD:
                        from_addr = item.get("from_address", "")
                        to_addr = item.get("to_address", "")
                        
                        whale_tx = {
                            "signature": tx_hash,
                            "network": network_key,
                            "token_name": "Native Token",
                            "token_symbol": "ETH/MATIC/AVA",
                            "amount_usd": round(value_usd, 2),
                            "amount_cad": round(value_usd * USD_TO_CAD_RATE, 2),
                            "from_address": f"{from_addr[:8]}...{from_addr[-4:]}",
                            "to_address": f"{to_addr[:8]}...{to_addr[-4:]}",
                            "timestamp": item.get("block_signed_at"),
                            "explorer_url": f"{explorer_base}{tx_hash}",
                            "transaction_type": "transfer",
                            "fetched_at": datetime.now(timezone.utc).isoformat()
                        }
                        transactions.append(whale_tx)
                        logger.info(f"Found {network_key} whale: ${value_usd:,.0f}")
            
            except Exception as e:
                logger.error(f"Error fetching {network_key}: {e}")
    
    return transactions

async def run_fetcher():
    """Main fetcher loop - Now multi-chain!"""
    logger.info("Starting Multi-Chain Whale Fetcher...")
    
    while True:
        try:
            # 1. Fetch Solana
            sol_txs = await fetch_solana_whales()
            if sol_txs: await store_transactions(sol_txs)
            
            # 2. Loop through every EVM network
            for net_key, config in SUPPORTED_EVM_NETWORKS.items():
                evm_txs = await fetch_evm_whales(net_key, config)
                if evm_txs: await store_transactions(evm_txs)
                # Small sleep to avoid hitting Covalent rate limits
                await asyncio.sleep(2)
            
            logger.info("Cycle complete. Waiting 5 mins...")
        except Exception as e:
            logger.error(f"Main loop error: {e}")
        
        await asyncio.sleep(300)

async def store_transactions(transactions: list):
    """Store whale transactions in MongoDB (Keep existing function)"""
    for tx in transactions:
        await db.whale_transactions.update_one({"signature": tx["signature"]}, {"$set": tx}, upsert=True)
    logger.info(f"Stored {len(transactions)} new transactions")

if __name__ == "__main__":
    asyncio.run(run_fetcher())