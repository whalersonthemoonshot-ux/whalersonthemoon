import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LegalPages.css";

const Disclaimer = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page" data-testid="disclaimer-page">
      <div className="legal-header">
        <button 
          className="back-btn" 
          onClick={() => navigate("/")}
          data-testid="back-btn"
        >
          <ArrowLeft size={18} />
          BACK TO DASHBOARD
        </button>
      </div>

      <div className="legal-content">
        <div className="disclaimer-warning">
          <AlertTriangle size={48} />
          <h1 className="legal-title">IMPORTANT DISCLAIMER</h1>
        </div>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section className="legal-section disclaimer-highlight">
          <h2>NOT FINANCIAL ADVICE</h2>
          <p>
            <strong>THE INFORMATION PROVIDED BY WHALERS ON THE MOON IS FOR INFORMATIONAL AND 
            EDUCATIONAL PURPOSES ONLY. IT IS NOT INTENDED TO BE, AND SHOULD NOT BE CONSTRUED AS, 
            FINANCIAL ADVICE, INVESTMENT ADVICE, TRADING ADVICE, OR ANY OTHER TYPE OF ADVICE.</strong>
          </p>
        </section>

        <section className="legal-section">
          <h2>1. GENERAL DISCLAIMER</h2>
          <p>
            Whalers on the Moon provides blockchain transaction data and whale movement tracking 
            for informational purposes only. We do not provide personalized investment advice, 
            financial planning, legal, or tax advice.
          </p>
          <p>
            The display of whale transactions does not constitute a recommendation to buy, sell, 
            or hold any cryptocurrency or digital asset. Past whale activity is not indicative 
            of future price movements or investment returns.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. CRYPTOCURRENCY RISKS</h2>
          <p>
            Cryptocurrency and digital assets are highly volatile and speculative. You should be 
            aware of the following risks:
          </p>
          <ul>
            <li><strong>Price Volatility:</strong> Cryptocurrency prices can fluctuate dramatically in short periods</li>
            <li><strong>Loss of Capital:</strong> You may lose some or all of your investment</li>
            <li><strong>Regulatory Risk:</strong> Cryptocurrency regulations vary by jurisdiction and may change</li>
            <li><strong>Technical Risk:</strong> Smart contracts and blockchain networks may have vulnerabilities</li>
            <li><strong>Liquidity Risk:</strong> Some assets may be difficult to sell at desired prices</li>
            <li><strong>Market Manipulation:</strong> Cryptocurrency markets may be subject to manipulation</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. DATA ACCURACY</h2>
          <p>
            While we strive to provide accurate and timely blockchain data, we cannot guarantee:
          </p>
          <ul>
            <li>The accuracy, completeness, or timeliness of transaction data</li>
            <li>That all whale transactions will be detected or displayed</li>
            <li>The accuracy of token valuations or USD/CAD conversions</li>
            <li>Uninterrupted access to blockchain data sources</li>
          </ul>
          <p>
            Blockchain data is sourced from third-party providers (Helius, Covalent) and is 
            provided "as is" without warranty.
          </p>
        </section>

        <section className="legal-section disclaimer-highlight">
          <h2>DATA LATENCY NOTICE</h2>
          <p>
            <strong>BASE NETWORK DATA MAY EXPERIENCE DELAYS.</strong> Our Base network data is 
            sourced from Covalent API, which may occasionally experience latency or timeout issues. 
            This means:
          </p>
          <ul>
            <li>Base network transactions may appear with a delay of several minutes</li>
            <li>Some Base transactions may temporarily not appear during API outages</li>
            <li>Solana network data (via Helius API) is typically more real-time</li>
          </ul>
          <p>
            We have implemented retry mechanisms to improve reliability, but external API 
            performance is outside our control. Do not rely solely on this service for 
            time-sensitive trading decisions.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. NO GUARANTEE OF RESULTS</h2>
          <p>
            Tracking whale transactions does not guarantee profitable trading outcomes. Large 
            wallet transactions may occur for many reasons unrelated to market sentiment, including:
          </p>
          <ul>
            <li>Exchange transfers and rebalancing</li>
            <li>Institutional custody movements</li>
            <li>Over-the-counter (OTC) deals</li>
            <li>Wallet consolidation</li>
            <li>Tax-related transactions</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. DO YOUR OWN RESEARCH (DYOR)</h2>
          <p>
            Before making any investment decisions, you should:
          </p>
          <ul>
            <li>Conduct thorough research on any cryptocurrency or project</li>
            <li>Understand the technology, team, and use case</li>
            <li>Assess your risk tolerance and financial situation</li>
            <li>Consult with qualified financial, legal, and tax professionals</li>
            <li>Never invest more than you can afford to lose</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. REGULATORY COMPLIANCE</h2>
          <p>
            Cryptocurrency regulations vary by jurisdiction. You are responsible for:
          </p>
          <ul>
            <li>Understanding and complying with local laws and regulations</li>
            <li>Reporting cryptocurrency transactions for tax purposes</li>
            <li>Ensuring your use of the Service is legal in your jurisdiction</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. NO ENDORSEMENT</h2>
          <p>
            The display of any token, cryptocurrency, or transaction on our Service does not 
            constitute an endorsement or recommendation. We do not verify the legitimacy of 
            tokens or projects tracked on blockchain networks.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. LIMITATION OF LIABILITY</h2>
          <p>
            WHALERS ON THE MOON, ITS OWNERS, OPERATORS, AND AFFILIATES SHALL NOT BE LIABLE FOR 
            ANY LOSSES, DAMAGES, OR CLAIMS ARISING FROM:
          </p>
          <ul>
            <li>Investment decisions based on information from our Service</li>
            <li>Inaccurate or delayed blockchain data</li>
            <li>Technical issues or service interruptions</li>
            <li>Actions taken by third parties</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. ACKNOWLEDGMENT</h2>
          <p>
            By using Whalers on the Moon, you acknowledge that you have read, understood, and 
            agree to this Disclaimer. You confirm that:
          </p>
          <ul>
            <li>You understand the risks associated with cryptocurrency</li>
            <li>You will not rely solely on our Service for investment decisions</li>
            <li>You accept full responsibility for your trading and investment activities</li>
            <li>You are of legal age to use this Service in your jurisdiction</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>10. CONTACT</h2>
          <p>
            If you have questions about this Disclaimer, please contact us at:
          </p>
          <p className="contact-info">
            Email: legal@whalersonthemoon.com
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <p>WHALERS ON THE MOON v1.0</p>
      </div>
    </div>
  );
};

export default Disclaimer;
