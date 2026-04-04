"""
Telegram Bot Handler for Whalers on the Moon
Run this separately: python telegram_bot.py
"""
import asyncio
import logging
import os
import httpx
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:8001/api')

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    welcome_message = """
🐋 *Welcome to Whalers on the Moon!*

I'll send you instant alerts when whales make big moves on Solana and Base.

*Commands:*
/connect CODE - Connect your subscription
/status - Check your connection status
/help - Show this message

*To get started:*
1. Subscribe at whalersonthemoon.com
2. Get your connect code from the website
3. Send: /connect YOUR_CODE
"""
    await update.message.reply_text(welcome_message, parse_mode='Markdown')


async def connect_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /connect CODE command"""
    chat_id = update.effective_chat.id
    
    if not context.args or len(context.args) < 1:
        await update.message.reply_text(
            "❌ Please provide your connection code.\n\n"
            "Usage: `/connect YOUR_CODE`\n\n"
            "Get your code from the website after subscribing.",
            parse_mode='Markdown'
        )
        return
    
    code = context.args[0].upper()
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{API_BASE_URL}/telegram/verify-code",
                params={"code": code, "chat_id": chat_id}
            )
            
            data = response.json()
            
            if data.get("status") == "success":
                tier = data.get("tier", "free")
                email = data.get("email", "")
                
                await update.message.reply_text(
                    f"✅ *Connected successfully!*\n\n"
                    f"Email: {email}\n"
                    f"Plan: {tier.upper()}\n\n"
                    f"You'll now receive instant whale alerts here! 🐋",
                    parse_mode='Markdown'
                )
            else:
                await update.message.reply_text(
                    f"❌ {data.get('message', 'Invalid or expired code')}\n\n"
                    "Please get a new code from the website.",
                    parse_mode='Markdown'
                )
                
    except Exception as e:
        logger.error(f"Connect error: {e}")
        await update.message.reply_text(
            "❌ Connection failed. Please try again later.",
            parse_mode='Markdown'
        )


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status command"""
    chat_id = update.effective_chat.id
    
    await update.message.reply_text(
        f"📊 *Your Status*\n\n"
        f"Chat ID: `{chat_id}`\n\n"
        f"If you're subscribed, you'll receive alerts here automatically.",
        parse_mode='Markdown'
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    await start_command(update, context)


def main():
    """Start the bot"""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return
    
    # Create application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("connect", connect_command))
    application.add_handler(CommandHandler("status", status_command))
    application.add_handler(CommandHandler("help", help_command))
    
    # Run the bot
    logger.info("Starting Whalers Telegram Bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
