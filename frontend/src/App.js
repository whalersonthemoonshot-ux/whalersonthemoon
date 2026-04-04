import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { ExternalLink, Bell, Waves, RefreshCw, Volume2, VolumeX, Settings, X, Zap } from "lucide-react";
import PricingPage from "./PricingPage";
import "./PricingPage.css";
import ConnectTelegramPage from "./ConnectTelegramPage";
import "./ConnectTelegramPage.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const DEFAULT_THRESHOLD = 100000; // $100,000
const DEFAULT_CURRENCY = "CAD";

// Load settings from localStorage
const loadSettings = () => {
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
const saveSettings = (settings) => {
  try {
    localStorage.setItem('whalerSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

// Currency conversion rates (approximate, relative to USD)
const CURRENCY_RATES = {
  USD: 1,
  CAD: 1.38,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  CAD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "$",
};

// Notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19LRUVQAFdBVkVmbXQgEAAAAAEAAQBBIgAAQCIAAQAIAGRhdGEAAPA/AAAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/AACAPwAAgD8AAIA/";

// ASCII Art Whale
const ASCII_WHALE = `
    .---.
   /     \\
  | () () |
   \\  ^  /
    |||||
    |||||
`;

// Format currency dynamically
const formatCurrency = (amount, currency = "CAD") => {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
};

// Convert USD to target currency
const convertFromUSD = (usdAmount, targetCurrency) => {
  const rate = CURRENCY_RATES[targetCurrency] || 1;
  return usdAmount * rate;
};

// Format currency to CAD (legacy, kept for compatibility)
const formatCAD = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format currency to USD
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format timestamp
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Subscribe Modal Component
const SubscribeModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      await axios.post(`${API}/subscribe`, { email });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to subscribe. Please try again.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="subscribe-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="modal-close-btn">
          ×
        </button>
        
        {status === "success" ? (
          <div className="modal-success" data-testid="subscribe-success">
            <pre className="ascii-whale" style={{ fontSize: '0.5rem', marginBottom: '1rem' }}>
{`   __
  / _)
 ( (
  \\ \\__
   \\___)`}
            </pre>
            <p>SUBSCRIPTION CONFIRMED</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--terminal-green-dim)' }}>
              You'll receive alerts for whale moves &gt; $100K CAD
            </p>
          </div>
        ) : (
          <>
            <h2 className="modal-title">SUBSCRIBE FOR ALERTS</h2>
            <p className="modal-subtitle">
              Get notified when whales make big moves (&gt;$100K CAD)
            </p>
            
            {error && <p className="modal-error">{error}</p>}
            
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                className="modal-input"
                placeholder="ENTER EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
              />
              <button
                type="submit"
                className="modal-submit"
                disabled={status === "loading"}
                data-testid="subscribe-submit-btn"
              >
                {status === "loading" ? "PROCESSING..." : "SUBSCRIBE"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, threshold, setThreshold, refreshInterval, setRefreshInterval, currency, setCurrency }) => {
  const [tempThreshold, setTempThreshold] = useState(threshold);
  const [tempInterval, setTempInterval] = useState(refreshInterval / 1000); // Convert to seconds
  const [tempCurrency, setTempCurrency] = useState(currency);

  const handleSave = () => {
    setThreshold(tempThreshold);
    setRefreshInterval(tempInterval * 1000); // Convert back to ms
    setCurrency(tempCurrency);
    onClose();
  };

  const thresholdOptions = [
    { value: 50000, label: `${CURRENCY_SYMBOLS[tempCurrency]}50K` },
    { value: 100000, label: `${CURRENCY_SYMBOLS[tempCurrency]}100K` },
    { value: 250000, label: `${CURRENCY_SYMBOLS[tempCurrency]}250K` },
    { value: 500000, label: `${CURRENCY_SYMBOLS[tempCurrency]}500K` },
    { value: 1000000, label: `${CURRENCY_SYMBOLS[tempCurrency]}1M` },
  ];

  const intervalOptions = [
    { value: 10, label: "10s" },
    { value: 15, label: "15s" },
    { value: 30, label: "30s" },
    { value: 60, label: "1min" },
    { value: 120, label: "2min" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD $" },
    { value: "CAD", label: "CAD $" },
    { value: "EUR", label: "EUR €" },
    { value: "GBP", label: "GBP £" },
    { value: "AUD", label: "AUD $" },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="settings-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} data-testid="settings-close-btn">
          <X size={20} />
        </button>
        
        <h2 className="modal-title">SETTINGS</h2>
        <p className="modal-subtitle">Configure your whale tracker preferences</p>
        
        <div className="settings-group">
          <label className="settings-label">DISPLAY CURRENCY</label>
          <div className="settings-options">
            {currencyOptions.map((opt) => (
              <button
                key={opt.value}
                className={`settings-option ${tempCurrency === opt.value ? 'active' : ''}`}
                onClick={() => setTempCurrency(opt.value)}
                data-testid={`currency-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">Primary currency for displaying amounts</p>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">WHALE THRESHOLD ({tempCurrency})</label>
          <div className="settings-options">
            {thresholdOptions.map((opt) => (
              <button
                key={opt.value}
                className={`settings-option ${tempThreshold === opt.value ? 'active' : ''}`}
                onClick={() => setTempThreshold(opt.value)}
                data-testid={`threshold-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">Only show transactions above this value</p>
        </div>

        <div className="settings-group">
          <label className="settings-label">AUTO-REFRESH INTERVAL</label>
          <div className="settings-options">
            {intervalOptions.map((opt) => (
              <button
                key={opt.value}
                className={`settings-option ${tempInterval === opt.value ? 'active' : ''}`}
                onClick={() => setTempInterval(opt.value)}
                data-testid={`interval-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">How often to check for new whale moves</p>
        </div>

        <button
          className="modal-submit"
          onClick={handleSave}
          data-testid="settings-save-btn"
        >
          SAVE SETTINGS
        </button>
      </div>
    </div>
  );
};

// Transaction Row Component
const TransactionRow = ({ transaction, isNew, currency }) => {
  // Convert amount to selected currency
  const amountInCurrency = convertFromUSD(transaction.amount_usd, currency);
  
  return (
    <div 
      className={`transaction-row ${isNew ? 'new-transaction' : ''}`} 
      data-testid={`transaction-${transaction.signature.slice(0, 8)}`}
    >
      <div>
        <span className={`network-badge ${transaction.network}`}>
          {transaction.network.toUpperCase()}
        </span>
      </div>
      
      <div className="token-info">
        <span className="token-name">
          {transaction.token_name} ({transaction.token_symbol})
          {isNew && <span className="new-badge">NEW</span>}
        </span>
        <span className="token-addresses">
          {transaction.from_address} → {transaction.to_address}
        </span>
        <span className="timestamp">
          {formatTime(transaction.timestamp)} | {transaction.transaction_type.toUpperCase()}
        </span>
      </div>
      
      <div className="amount-info">
        <div className="amount-cad" data-testid={`amount-${transaction.signature.slice(0, 8)}`}>
          {formatCurrency(amountInCurrency, currency)}
        </div>
        <div className="amount-usd">
          {formatUSD(transaction.amount_usd)} USD
        </div>
      </div>
      
      <div>
        <a
          href={transaction.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="explorer-link"
          data-testid="explorer-link"
        >
          <ExternalLink size={14} />
          View on Explorer
        </a>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  // Load initial settings from localStorage
  const initialSettings = loadSettings();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNetwork, setActiveNetwork] = useState("all");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings.soundEnabled);
  const [newTransactionIds, setNewTransactionIds] = useState(new Set());
  const [threshold, setThreshold] = useState(initialSettings.threshold);
  const [refreshInterval, setRefreshInterval] = useState(initialSettings.refreshInterval);
  const [currency, setCurrency] = useState(initialSettings.currency);
  
  const previousTransactionsRef = useRef([]);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettings({
      threshold,
      refreshInterval,
      currency,
      soundEnabled,
    });
  }, [threshold, refreshInterval, currency, soundEnabled]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio();
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // A5 note
    gainNode.gain.value = 0.3;
    
    audioRef.current = { audioContext, oscillator, gainNode };
    
    return () => {
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio notification not supported');
    }
  }, [soundEnabled]);

  const fetchTransactions = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      // Always fetch all transactions, filtering is done client-side
      const response = await axios.get(`${API}/transactions`);
      const newTxs = response.data.transactions;
      
      // Check for new transactions (only after initial load)
      if (previousTransactionsRef.current.length > 0) {
        const previousIds = new Set(previousTransactionsRef.current.map(tx => tx.signature));
        const brandNewTxs = newTxs.filter(tx => !previousIds.has(tx.signature));
        
        if (brandNewTxs.length > 0) {
          // Play sound for new whale transactions
          playNotificationSound();
          
          // Mark new transactions for highlight
          setNewTransactionIds(new Set(brandNewTxs.map(tx => tx.signature)));
          
          // Clear highlight after 5 seconds
          setTimeout(() => {
            setNewTransactionIds(new Set());
          }, 5000);
        }
      }
      
      previousTransactionsRef.current = newTxs;
      setTransactions(newTxs);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to fetch whale transactions");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [playNotificationSound]); // Remove activeNetwork dependency

  useEffect(() => {
    fetchTransactions();
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up auto-refresh with dynamic interval
    intervalRef.current = setInterval(() => {
      fetchTransactions(true);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTransactions, refreshInterval]);

  // Filter transactions by threshold (convert USD to selected currency for comparison)
  const thresholdFilteredTxs = transactions.filter(tx => {
    const amountInCurrency = convertFromUSD(tx.amount_usd, currency);
    return amountInCurrency >= threshold;
  });
  
  // Calculate stats from threshold-filtered transactions (in selected currency)
  const totalVolume = thresholdFilteredTxs.reduce((sum, tx) => sum + convertFromUSD(tx.amount_usd, currency), 0);
  const solanaCount = thresholdFilteredTxs.filter(tx => tx.network === "solana").length;
  const baseCount = thresholdFilteredTxs.filter(tx => tx.network === "base").length;
  const largestTx = thresholdFilteredTxs.length > 0 
    ? Math.max(...thresholdFilteredTxs.map(tx => convertFromUSD(tx.amount_usd, currency)))
    : 0;

  // Apply network filter on top of threshold filter
  const filteredTransactions = activeNetwork === "all" 
    ? thresholdFilteredTxs 
    : thresholdFilteredTxs.filter(tx => tx.network === activeNetwork);

  return (
    <div className="App">
      {/* Scanline Overlay */}
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="terminal-header">
        <div className="header-content">
          <div className="logo-section">
            <pre className="ascii-whale" data-testid="ascii-whale">
{`   __
  / _)
 ( (
  \\ \\__
   \\___)`}
            </pre>
            <div>
              <h1 className="app-title" data-testid="app-title">WHALERS ON THE MOON</h1>
              <p className="app-subtitle">REAL-TIME WHALE TRANSACTION TRACKER</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              className="upgrade-btn"
              onClick={() => navigate("/pricing")}
              data-testid="upgrade-btn"
              title="Upgrade for Telegram Alerts"
            >
              <Zap size={18} />
              UPGRADE
            </button>
            
            <button
              className="settings-btn"
              onClick={() => setShowSettingsModal(true)}
              data-testid="settings-btn"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            
            <button
              className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              data-testid="sound-toggle-btn"
              title={soundEnabled ? "Sound On" : "Sound Off"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button 
              className="subscribe-btn" 
              onClick={() => setShowSubscribeModal(true)}
              data-testid="subscribe-btn"
            >
              <Bell size={18} />
              SUBSCRIBE FOR ALERTS
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Bar */}
        <div className="stats-bar" data-testid="stats-bar">
          <div className="stat-card">
            <div className="stat-label">TOTAL VOLUME ({currency})</div>
            <div className="stat-value" data-testid="total-volume">{formatCurrency(totalVolume, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">LARGEST MOVE</div>
            <div className="stat-value" data-testid="largest-move">{formatCurrency(largestTx, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">SOLANA TXS</div>
            <div className="stat-value" data-testid="solana-count">{solanaCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">BASE TXS</div>
            <div className="stat-value" data-testid="base-count">{baseCount}</div>
          </div>
        </div>

        {/* Network Tabs */}
        <div className="network-tabs" data-testid="network-tabs">
          <button
            className={`network-tab ${activeNetwork === "all" ? "active" : ""}`}
            onClick={() => setActiveNetwork("all")}
            data-testid="tab-all"
          >
            ALL
          </button>
          <button
            className={`network-tab ${activeNetwork === "solana" ? "active" : ""}`}
            onClick={() => setActiveNetwork("solana")}
            data-testid="tab-solana"
          >
            SOLANA
          </button>
          <button
            className={`network-tab ${activeNetwork === "base" ? "active" : ""}`}
            onClick={() => setActiveNetwork("base")}
            data-testid="tab-base"
          >
            BASE
          </button>
        </div>

        {/* Transactions Section */}
        <div className="transactions-section" data-testid="transactions-section">
          <div className="section-header">
            <h2 className="section-title">
              <Waves size={18} />
              BIG MOVES
            </h2>
            <div className="live-indicator">
              {isRefreshing ? (
                <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <span className="live-dot" />
              )}
              <span>
                {isRefreshing ? "UPDATING..." : "LIVE"} 
                {lastUpdated && ` | ${formatTime(lastUpdated)}`}
              </span>
            </div>
          </div>

          <div className="transaction-list" data-testid="transaction-list">
            {loading ? (
              <div className="loading-container">
                <pre className="ascii-loading">
{`  |  
 -+-
  |  `}
                </pre>
                <p className="loading-text">SCANNING BLOCKCHAIN...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <p className="empty-text" style={{ color: 'var(--terminal-error)' }}>{error}</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state" data-testid="empty-state">
                <pre className="empty-whale">
{`        .
       ":"
     ___:____     |"\\/"|
   ,'        \`.    \\  /
   |  O        \\___/  |
 ~^~^~^~^~^~^~^~^~^~^~^~^~`}
                </pre>
                <p className="empty-text">NO WHALE ACTIVITY DETECTED</p>
                <p className="empty-text" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  MONITORING FOR TRANSACTIONS &gt; {formatCurrency(threshold, currency)}
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <TransactionRow 
                  key={tx.id || tx.signature} 
                  transaction={tx} 
                  isNew={newTransactionIds.has(tx.signature)}
                  currency={currency}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="terminal-footer">
          <p>WHALERS ON THE MOON v1.0 | TRACKING SOLANA & BASE NETWORKS</p>
          <p>THRESHOLD: {formatCurrency(threshold, currency)} {currency} | AUTO-REFRESH: {refreshInterval / 1000}s</p>
        </footer>
      </main>

      {/* Subscribe Modal */}
      <SubscribeModal 
        isOpen={showSubscribeModal} 
        onClose={() => setShowSubscribeModal(false)} 
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        threshold={threshold}
        setThreshold={setThreshold}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        currency={currency}
        setCurrency={setCurrency}
      />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<PricingPage />} />
        <Route path="/connect-telegram" element={<ConnectTelegramPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
