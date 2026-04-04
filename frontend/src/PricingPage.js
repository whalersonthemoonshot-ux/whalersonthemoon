import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Check, Zap, Crown, ArrowLeft, Loader2 } from "lucide-react";

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

  const handleUpgrade = async (tier) => {
    if (!email) {
      setError("Please enter your email address first");
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
        tier,
        origin_url: window.location.origin
      });

      // Redirect to Stripe
      window.location.href = response.data.url;

    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Basic whale watching",
      features: [
        "Website dashboard access",
        "30 second refresh rate",
        "Email alerts (manual)",
        "All networks (Solana, Base)"
      ],
      icon: <Check size={24} />,
      buttonText: "Current Plan",
      disabled: true
    },
    {
      id: "pro",
      name: "Pro",
      price: "$10",
      period: "/month",
      description: "For serious traders",
      features: [
        "Everything in Free",
        "Instant Telegram alerts",
        "15 second refresh rate",
        "Priority email alerts",
        "Custom threshold alerts"
      ],
      icon: <Zap size={24} />,
      buttonText: "Upgrade to Pro",
      popular: true
    },
    {
      id: "whale",
      name: "Whale",
      price: "$25",
      period: "/month",
      description: "Maximum alpha",
      features: [
        "Everything in Pro",
        "5 second refresh rate",
        "API access",
        "Multiple wallet tracking",
        "Priority support",
        "Early feature access"
      ],
      icon: <Crown size={24} />,
      buttonText: "Go Whale"
    }
  ];

  if (paymentSuccess) {
    return (
      <div className="pricing-page">
        <div className="success-container">
          <div className="success-icon">🐋</div>
          <h1>Welcome to {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}!</h1>
          <p>Your subscription is now active.</p>
          <p className="success-hint">Connect your Telegram to receive instant alerts!</p>
          <button onClick={() => navigate("/")} className="back-btn">
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
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

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <button onClick={() => navigate("/")} className="back-link">
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <h1>UPGRADE YOUR PLAN</h1>
        <p>Get instant Telegram alerts when whales make moves</p>
      </div>

      {error && <div className="pricing-error">{error}</div>}

      <div className="email-input-section">
        <label>YOUR EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          data-testid="pricing-email-input"
        />
        {currentTier !== "free" && (
          <p className="current-tier">Current plan: <strong>{currentTier.toUpperCase()}</strong></p>
        )}
      </div>

      <div className="pricing-grid">
        {tiers.map((tier) => (
          <div 
            key={tier.id} 
            className={`pricing-card ${tier.popular ? 'popular' : ''} ${currentTier === tier.id ? 'current' : ''}`}
            data-testid={`tier-${tier.id}`}
          >
            {tier.popular && <div className="popular-badge">MOST POPULAR</div>}
            {currentTier === tier.id && <div className="current-badge">CURRENT</div>}
            
            <div className="tier-icon">{tier.icon}</div>
            <h2>{tier.name}</h2>
            <div className="tier-price">
              <span className="price">{tier.price}</span>
              <span className="period">{tier.period}</span>
            </div>
            <p className="tier-description">{tier.description}</p>
            
            <ul className="tier-features">
              {tier.features.map((feature, i) => (
                <li key={i}>
                  <Check size={16} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(tier.id)}
              disabled={tier.disabled || loading || currentTier === tier.id}
              className={`tier-button ${tier.id}`}
              data-testid={`upgrade-${tier.id}`}
            >
              {loading ? "Processing..." : currentTier === tier.id ? "Current Plan" : tier.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p>🔒 Secure payment powered by Stripe</p>
        <p>Cancel anytime • No hidden fees</p>
      </div>
    </div>
  );
};

export default PricingPage;
