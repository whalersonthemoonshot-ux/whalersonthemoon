import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Check, Zap, ArrowLeft, Loader2, Bell, MessageCircle, Clock, Shield } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PricingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTier, setCurrentTier] = useState("free");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check for successful payment return
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("whalerEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      fetchUserSubscription(savedEmail);
    }
  }, []);

  const fetchUserSubscription = async (userEmail) => {
    try {
      const response = await axios.get(`${API}/subscription/${userEmail}`);
      setCurrentTier(response.data.tier || "free");
    } catch (err) {
      // User not found, that's ok
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    
    if (attempts >= maxAttempts) {
      setError("Payment verification timed out. Please check your email for confirmation.");
      setCheckingPayment(false);
      return;
    }

    setCheckingPayment(true);

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      
      if (response.data.payment_status === "paid") {
        setPaymentSuccess(true);
        setCurrentTier(response.data.tier);
        setCheckingPayment(false);
        
        // Clear URL params
        window.history.replaceState({}, "", "/pricing");
        return;
      }
      
      // Keep polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      
    } catch (err) {
      console.error("Error checking payment:", err);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    }
  };

  const handleStartTrial = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Save email
      localStorage.setItem("whalerEmail", email);

      // First ensure user is subscribed
      try {
        await axios.post(`${API}/subscribe`, { email });
      } catch (err) {
        // Already subscribed is fine
        if (!err.response?.data?.detail?.includes("already subscribed")) {
          throw err;
        }
      }

      // Create checkout session
      const response = await axios.post(`${API}/checkout/create`, {
        email,
        tier: "premium",
        origin_url: window.location.origin
      });

      // Redirect to Stripe
      window.location.href = response.data.url;

    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="pricing-page">
        <div className="success-container">
          <div className="success-icon">🐋</div>
          <h1>Welcome to Premium!</h1>
          <p>Your 3-day free trial has started.</p>
          <p className="success-note">You won't be charged until the trial ends.</p>
          
          <div className="success-actions">
            <button onClick={() => navigate("/connect-telegram")} className="connect-telegram-btn">
              <MessageCircle size={18} />
              Connect Telegram for Instant Alerts
            </button>
            <button onClick={() => navigate("/")} className="back-btn">
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checkingPayment) {
    return (
      <div className="pricing-page">
        <div className="checking-container">
          <Loader2 size={48} className="spin" />
          <h2>Verifying Payment...</h2>
          <p>Please wait while we confirm your subscription.</p>
        </div>
      </div>
    );
  }

  const isPremium = currentTier === "premium";

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <button onClick={() => navigate("/")} className="back-link">
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <h1>UNLOCK WHALE ALERTS</h1>
        <p>Get instant notifications when whales make big moves</p>
      </div>

      {error && <div className="pricing-error">{error}</div>}

      <div className="pricing-single">
        {/* Free Tier Info */}
        <div className="free-info">
          <h3>FREE DASHBOARD ACCESS</h3>
          <p>View whale transactions anytime on the dashboard</p>
        </div>

        {/* Premium Card */}
        <div className={`pricing-card premium ${isPremium ? 'current' : ''}`} data-testid="tier-premium">
          <div className="trial-badge">3-DAY FREE TRIAL</div>
          {isPremium && <div className="current-badge">CURRENT PLAN</div>}
          
          <div className="tier-icon"><Zap size={32} /></div>
          <h2>Premium</h2>
          <div className="tier-price">
            <span className="price">$9.99</span>
            <span className="period">/month USD</span>
          </div>
          <p className="tier-description">Full access to all whale alerts</p>
          
          <ul className="tier-features">
            <li>
              <MessageCircle size={16} />
              Instant Telegram alerts
            </li>
            <li>
              <Bell size={16} />
              Priority email alerts
            </li>
            <li>
              <Clock size={16} />
              10-second refresh rate
            </li>
            <li>
              <Shield size={16} />
              Custom threshold alerts
            </li>
            <li>
              <Check size={16} />
              All networks (Solana + Base)
            </li>
            <li>
              <Check size={16} />
              Priority support
            </li>
          </ul>

          {!isPremium && (
            <div className="email-input-inline">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                data-testid="pricing-email-input"
              />
            </div>
          )}

          <button
            onClick={handleStartTrial}
            disabled={loading || isPremium}
            className="tier-button premium"
            data-testid="start-trial-btn"
          >
            {loading ? "Processing..." : isPremium ? "Current Plan" : "START FREE TRIAL"}
          </button>
          
          {!isPremium && (
            <p className="trial-note">No charge for 3 days. Cancel anytime.</p>
          )}
        </div>
      </div>

      <div className="pricing-footer">
        <p><Shield size={14} /> Secure payment powered by Stripe</p>
        <p>Cancel anytime • No hidden fees • Billed monthly after trial</p>
      </div>
    </div>
  );
};

export default PricingPage;
