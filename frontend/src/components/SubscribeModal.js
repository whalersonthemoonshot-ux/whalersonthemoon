import { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

export default SubscribeModal;
