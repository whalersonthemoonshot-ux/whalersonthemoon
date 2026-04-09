import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";

// Pages
import PricingPage from "./PricingPage";
import "./PricingPage.css";
import ConnectTelegramPage from "./ConnectTelegramPage";
import "./ConnectTelegramPage.css";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Disclaimer from "./Disclaimer";
import "./LegalPages.css";

// Components
import Header from "./components/Header";
import ShipBanner from "./components/ShipBanner";
import StatsBar from "./components/StatsBar";
import NetworkTabs from "./components/NetworkTabs";
import TransactionList from "./components/TransactionList";
import Footer from "./components/Footer";
import SubscribeModal from "./components/SubscribeModal";
import SettingsModal from "./components/SettingsModal";
import { loadSettings, saveSettings, convertFromUSD } from "./components/utils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
      const response = await axios.get(`${API}/transactions`);
      const newTxs = response.data.transactions;
      
      // Check for new transactions (only after initial load)
      if (previousTransactionsRef.current.length > 0) {
        const previousIds = new Set(previousTransactionsRef.current.map(tx => tx.signature));
        const brandNewTxs = newTxs.filter(tx => !previousIds.has(tx.signature));
        
        if (brandNewTxs.length > 0) {
          playNotificationSound();
          setNewTransactionIds(new Set(brandNewTxs.map(tx => tx.signature)));
          
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
  }, [playNotificationSound]);

  useEffect(() => {
    fetchTransactions();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchTransactions(true);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTransactions, refreshInterval]);

  // Filter transactions by threshold
  const thresholdFilteredTxs = transactions.filter(tx => {
    const amountInCurrency = convertFromUSD(tx.amount_usd, currency);
    return amountInCurrency >= threshold;
  });
  
  // Calculate stats
  const totalVolume = thresholdFilteredTxs.reduce((sum, tx) => sum + convertFromUSD(tx.amount_usd, currency), 0);
  const solanaCount = thresholdFilteredTxs.filter(tx => tx.network === "solana").length;
  const baseCount = thresholdFilteredTxs.filter(tx => tx.network === "base").length;
  const largestTx = thresholdFilteredTxs.length > 0 
    ? Math.max(...thresholdFilteredTxs.map(tx => convertFromUSD(tx.amount_usd, currency)))
    : 0;

  // Apply network filter
  const filteredTransactions = activeNetwork === "all" 
    ? thresholdFilteredTxs 
    : thresholdFilteredTxs.filter(tx => tx.network === activeNetwork);

  return (
    <div className="App">
      {/* Scanline Overlay */}
      <div className="scanline-overlay" />

      {/* Ship Banner */}
      <ShipBanner />

      {/* Header */}
      <Header
        navigate={navigate}
        onSettingsClick={() => setShowSettingsModal(true)}
        onSubscribeClick={() => setShowSubscribeModal(true)}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Bar */}
        <StatsBar
          totalVolume={totalVolume}
          largestTx={largestTx}
          solanaCount={solanaCount}
          baseCount={baseCount}
          currency={currency}
        />

        {/* Network Tabs */}
        <NetworkTabs
          activeNetwork={activeNetwork}
          setActiveNetwork={setActiveNetwork}
        />

        {/* Transaction List */}
        <TransactionList
          loading={loading}
          error={error}
          transactions={filteredTransactions}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          newTransactionIds={newTransactionIds}
          currency={currency}
          threshold={threshold}
        />

        {/* Footer */}
        <Footer
          threshold={threshold}
          currency={currency}
          refreshInterval={refreshInterval}
          navigate={navigate}
        />
      </main>

      {/* Modals */}
      <SubscribeModal 
        isOpen={showSubscribeModal} 
        onClose={() => setShowSubscribeModal(false)} 
      />
      
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
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
