import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Reveal } from '../components/ui/Reveal';

export function Privacy() {
  return (
    <div className="privacy-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>Back</span>
      </Link>

      <Reveal>
        <h1>Privacy Policy</h1>
        <p className="privacy-page__intro">
          Deadsmile Games respects your privacy. This policy explains how we collect, use, and protect your personal data.
        </p>
      </Reveal>

      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>1. Information we collect</h2>
          <p>
            We collect information you provide directly, such as when you create an account, subscribe to our newsletter, or contact support. This may include your name, email address, username, and any other details you choose to share.
          </p>
        </div>

        <div className="privacy-block">
          <h2>2. How we use your data</h2>
          <p>
            We use your data to operate, maintain, and improve our services, to communicate with you, and to personalize your experience. We do not sell your personal information to third parties.
          </p>
        </div>

        <div className="privacy-block">
          <h2>3. Cookies and tracking</h2>
          <p>
            We use essential session and security cookies when required to operate signed-in features. The site stores your cookie-banner preference locally in your browser, and protected forms may use third-party security services such as Google reCAPTCHA. We do not currently use an analytics-cookie integration in this website codebase.
          </p>
        </div>

        <div className="privacy-block">
          <h2>4. Data security</h2>
          <p>
            We implement reasonable security measures to protect your data. However, no method of transmission over the internet is 100% secure.
          </p>
        </div>

        <div className="privacy-block">
          <h2>5. Your rights</h2>
          <p>
            You may access, update, or delete your account information at any time through your account settings. For any questions, contact us at <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>.
          </p>
        </div>

        <div className="privacy-block">
          <h2>6. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. We will notify you of significant changes by posting a notice on our site.
          </p>
        </div>

        <p className="privacy-page__date">
          <small>Last updated: September 2026</small>
        </p>
      </section>
    </div>
  );
}