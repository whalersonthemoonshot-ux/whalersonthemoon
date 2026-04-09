import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LegalPages.css";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page" data-testid="terms-of-service-page">
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
        <h1 className="legal-title">TERMS OF SERVICE</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section className="legal-section">
          <h2>1. ACCEPTANCE OF TERMS</h2>
          <p>
            By accessing or using Whalers on the Moon ("Service"), you agree to be bound by these 
            Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. DESCRIPTION OF SERVICE</h2>
          <p>
            Whalers on the Moon is a cryptocurrency whale transaction tracking service that monitors 
            large transactions on the Solana and Base blockchain networks. The Service provides:
          </p>
          <ul>
            <li>Real-time whale transaction monitoring</li>
            <li>Email alerts for significant transactions (free tier)</li>
            <li>Telegram bot alerts (paid subscription)</li>
            <li>Customizable threshold and currency settings</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. USER ACCOUNTS AND SUBSCRIPTIONS</h2>
          <h3>3.1 Free Services</h3>
          <p>
            You may use the basic transaction tracking features without creating an account. 
            Email subscriptions require a valid email address.
          </p>

          <h3>3.2 Paid Subscriptions</h3>
          <p>
            Premium features (Telegram alerts) require a paid subscription. By subscribing, you agree to:
          </p>
          <ul>
            <li>Provide accurate payment information</li>
            <li>Pay the applicable subscription fees</li>
            <li>Subscription fees are billed monthly and are non-refundable except as required by law</li>
          </ul>

          <h3>3.3 Cancellation</h3>
          <p>
            You may cancel your subscription at any time. Cancellation takes effect at the end of 
            the current billing period. No refunds are provided for partial months.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. ACCEPTABLE USE</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Scrape, crawl, or use automated means to access the Service without permission</li>
            <li>Redistribute or resell access to the Service</li>
            <li>Use the Service to manipulate markets or engage in fraud</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. INTELLECTUAL PROPERTY</h2>
          <p>
            The Service, including its design, features, and content, is owned by Whalers on the Moon 
            and is protected by copyright, trademark, and other intellectual property laws. You may 
            not copy, modify, or distribute any part of the Service without our written consent.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. THIRD-PARTY SERVICES</h2>
          <p>
            The Service integrates with third-party services including Stripe (payments), 
            Telegram (messaging), and blockchain data providers (Helius, Covalent). Your use of 
            these services is subject to their respective terms and privacy policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. DISCLAIMER OF WARRANTIES</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
            ERROR-FREE, OR SECURE.
          </p>
          <p>
            BLOCKCHAIN DATA IS PROVIDED FOR INFORMATIONAL PURPOSES ONLY. WE DO NOT GUARANTEE 
            THE ACCURACY, COMPLETENESS, OR TIMELINESS OF TRANSACTION DATA.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. LIMITATION OF LIABILITY</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHALERS ON THE MOON SHALL NOT BE LIABLE FOR 
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT 
            NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE 
            OF THE SERVICE.
          </p>
          <p>
            IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) 
            MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. INDEMNIFICATION</h2>
          <p>
            You agree to indemnify and hold harmless Whalers on the Moon and its officers, directors, 
            employees, and agents from any claims, damages, losses, or expenses (including reasonable 
            attorney's fees) arising from your use of the Service or violation of these Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. MODIFICATIONS TO SERVICE</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) 
            at any time with or without notice. We shall not be liable to you or any third party for 
            any modification, suspension, or discontinuation of the Service.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. MODIFICATIONS TO TERMS</h2>
          <p>
            We may revise these Terms at any time by updating this page. By continuing to use the 
            Service after changes become effective, you agree to be bound by the revised Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. GOVERNING LAW</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the 
            jurisdiction in which Whalers on the Moon operates, without regard to its conflict 
            of law provisions.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. DISPUTE RESOLUTION</h2>
          <p>
            Any disputes arising from these Terms or the Service shall be resolved through binding 
            arbitration in accordance with applicable arbitration rules, unless prohibited by local law.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. SEVERABILITY</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions 
            shall continue in full force and effect.
          </p>
        </section>

        <section className="legal-section">
          <h2>15. CONTACT</h2>
          <p>
            For questions about these Terms, please contact us at:
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

export default TermsOfService;
