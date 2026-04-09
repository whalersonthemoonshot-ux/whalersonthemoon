import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LegalPages.css";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page" data-testid="privacy-policy-page">
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
        <h1 className="legal-title">PRIVACY POLICY</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section className="legal-section">
          <h2>1. INTRODUCTION</h2>
          <p>
            Welcome to Whalers on the Moon ("we," "our," or "us"). We are committed to protecting your 
            personal information and your right to privacy. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our whale transaction tracking service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. INFORMATION WE COLLECT</h2>
          <h3>2.1 Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us when you:</p>
          <ul>
            <li>Subscribe to our email alerts</li>
            <li>Purchase a subscription plan</li>
            <li>Connect your Telegram account</li>
            <li>Contact us for support</li>
          </ul>
          <p>This information may include:</p>
          <ul>
            <li>Email address</li>
            <li>Telegram username/ID</li>
            <li>Payment information (processed securely by Stripe)</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you access our service, we may automatically collect:</p>
          <ul>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Usage data (pages visited, time spent)</li>
            <li>Preferences stored in localStorage (threshold settings, currency preferences)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. HOW WE USE YOUR INFORMATION</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our whale tracking service</li>
            <li>Send you email alerts about whale transactions (if subscribed)</li>
            <li>Send Telegram notifications (if connected and subscribed)</li>
            <li>Process your subscription payments</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Improve our service and develop new features</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. THIRD-PARTY SERVICES</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Stripe:</strong> For secure payment processing. Stripe's privacy policy applies to payment data.</li>
            <li><strong>Telegram:</strong> For delivering premium alerts. Telegram's privacy policy applies.</li>
            <li><strong>SendGrid:</strong> For email delivery. SendGrid's privacy policy applies to email communications.</li>
            <li><strong>Helius API:</strong> For Solana blockchain data (no personal data shared).</li>
            <li><strong>Covalent API:</strong> For Base blockchain data (no personal data shared).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. DATA RETENTION</h2>
          <p>
            We retain your personal information only for as long as necessary to fulfill the purposes 
            outlined in this Privacy Policy. Subscription data is retained while your account is active 
            and for a reasonable period thereafter for legal and business purposes.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. DATA SECURITY</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your 
            personal information. However, no method of transmission over the Internet or electronic 
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. YOUR RIGHTS</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>To exercise these rights, please contact us using the information below.</p>
        </section>

        <section className="legal-section">
          <h2>8. COOKIES AND LOCAL STORAGE</h2>
          <p>
            We use localStorage to save your preferences (display currency, threshold settings, 
            sound preferences). This data is stored locally on your device and is not transmitted to our servers.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. CHILDREN'S PRIVACY</h2>
          <p>
            Our service is not intended for individuals under the age of 18. We do not knowingly 
            collect personal information from children. If you are a parent or guardian and believe 
            your child has provided us with personal information, please contact us.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. CHANGES TO THIS POLICY</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. CONTACT US</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="contact-info">
            Email: privacy@whalersonthemoon.com
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <p>WHALERS ON THE MOON v1.0</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
