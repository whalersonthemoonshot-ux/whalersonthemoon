import { formatCurrency } from "./utils";

const Footer = ({ threshold, currency, refreshInterval, navigate }) => {
  return (
    <footer className="terminal-footer">
      <p>WHALERS ON THE MOON v1.0 | TRACKING SOLANA & BASE NETWORKS</p>
      <p>THRESHOLD: {formatCurrency(threshold, currency)} {currency} | AUTO-REFRESH: {refreshInterval / 1000}s</p>
      <div className="footer-legal-links" data-testid="footer-legal-links">
        <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>PRIVACY POLICY</a>
        <span className="footer-divider">|</span>
        <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>TERMS OF SERVICE</a>
        <span className="footer-divider">|</span>
        <a href="/disclaimer" onClick={(e) => { e.preventDefault(); navigate('/disclaimer'); }}>DISCLAIMER</a>
      </div>
    </footer>
  );
};

export default Footer;
