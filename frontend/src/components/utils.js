// Currency conversion rates and utilities
export const CURRENCY_RATES = {
  USD: 1,
  CAD: 1.38,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
};

export const CURRENCY_SYMBOLS = {
  USD: "$",
  CAD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "$",
};

export const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
export const DEFAULT_THRESHOLD = 100; // $100 minimum
export const DEFAULT_CURRENCY = "CAD";

// Format currency dynamically
export const formatCurrency = (amount, currency = "CAD") => {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
};

// Convert USD to target currency
export const convertFromUSD = (usdAmount, targetCurrency) => {
  const rate = CURRENCY_RATES[targetCurrency] || 1;
  return usdAmount * rate;
};

// Format currency to USD
export const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format timestamp
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Load settings from localStorage
export const loadSettings = () => {
  try {
    const saved = localStorage.getItem('whalerSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    threshold: DEFAULT_THRESHOLD,
    refreshInterval: DEFAULT_REFRESH_INTERVAL,
    currency: DEFAULT_CURRENCY,
    soundEnabled: true,
  };
};

// Save settings to localStorage
export const saveSettings = (settings) => {
  try {
    localStorage.setItem('whalerSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};
