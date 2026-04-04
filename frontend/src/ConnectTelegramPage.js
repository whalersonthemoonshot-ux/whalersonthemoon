import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Copy, Check, MessageCircle, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConnectTelegramPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const savedEmail = localStorage.getItem("whalerEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const generateCode = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("whalerEmail", email);
      const response = await axios.get(`${API}/telegram/generate-code/${email}`);
      setCode(response.data.code);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate code. Make sure you're subscribed.");
    } finally {
      setLoading(false);
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(`/connect ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTelegram = () => {
    window.open("https://t.me/Whalersonthemoonbot", "_blank");
  };

  return (
    <div className="connect-page">
      <div className="connect-container">
        <button onClick={() => navigate("/")} className="back-link">
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="connect-header">
          <MessageCircle size={48} className="telegram-icon" />
          <h1>CONNECT TELEGRAM</h1>
          <p>Get instant whale alerts on your phone</p>
        </div>

        {error && <div className="connect-error">{error}</div>}

        {step === 1 && (
          <div className="connect-step">
            <div className="step-number">STEP 1</div>
            <h2>Enter Your Email</h2>
            <p>Use the same email you subscribed with</p>
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="connect-input"
              data-testid="connect-email-input"
            />
            
            <button 
              onClick={generateCode} 
              disabled={loading}
              className="connect-btn primary"
              data-testid="generate-code-btn"
            >
              {loading ? <Loader2 size={18} className="spin" /> : "Generate Connect Code"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="connect-step">
            <div className="step-number">STEP 2</div>
            <h2>Your Connect Code</h2>
            
            <div className="code-display">
              <span className="code">{code}</span>
              <button onClick={copyCommand} className="copy-btn">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div className="step-number" style={{ marginTop: '2rem' }}>STEP 3</div>
            <h2>Send to Telegram Bot</h2>
            <p>Open our bot and send this command:</p>
            
            <div className="command-display">
              <code>/connect {code}</code>
              <button onClick={copyCommand} className="copy-btn small">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <button 
              onClick={openTelegram}
              className="connect-btn telegram"
              data-testid="open-telegram-btn"
            >
              <MessageCircle size={18} />
              Open @Whalersonthemoonbot
            </button>

            <div className="connect-note">
              <p>After sending the command, you'll receive a confirmation message.</p>
              <p>Code expires in 10 minutes.</p>
            </div>

            <button 
              onClick={() => { setStep(1); setCode(""); }}
              className="connect-btn secondary"
            >
              Generate New Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectTelegramPage;
