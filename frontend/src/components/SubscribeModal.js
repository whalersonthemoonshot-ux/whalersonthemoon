import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SubscribeModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      await axios.post(`${API}/subscribe`, { email });
      localStorage.setItem("whalerEmail", email);
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

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
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
            <p>EMAIL REGISTERED</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--terminal-green-dim)', fontSize: '0.75rem' }}>
              Want instant Telegram & email alerts?
            </p>
            <button
              className="modal-submit"
              onClick={handleUpgrade}
              style={{ marginTop: '1rem' }}
            >
              START FREE TRIAL - $9.99/mo
            </button>
            <p style={{ marginTop: '0.5rem', color: 'var(--terminal-green-muted)', fontSize: '0.65rem' }}>
              3-day free trial • Cancel anytime
            </p>
          </div>
        ) : (
          <>
            <h2 className="modal-title">GET WHALE ALERTS</h2>
            <p className="modal-subtitle">
              Enter your email to start, then upgrade for instant alerts
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
                {status === "loading" ? "PROCESSING..." : "CONTINUE"}
              </button>
            </form>
            
            <p style={{ marginTop: '1rem', color: 'var(--terminal-green-muted)', fontSize: '0.65rem', textAlign: 'center' }}>
              Dashboard is free • Alerts require Premium ($9.99/mo)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
