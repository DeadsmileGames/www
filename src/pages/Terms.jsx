import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Reveal } from '../components/ui/Reveal';
import './Terms.css';

export function Terms() {
  return (
    <div className="terms-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>Back</span>
      </Link>

      <Reveal>
        <h1>Terms of Service</h1>
        <p className="terms-page__intro">
          By using Deadsmile Games, you agree to the following terms and conditions.
          Please read them carefully.
        </p>
      </Reveal>

      <section className="terms-page__content">
        <div className="terms-block">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Deadsmile Games website, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use our services.
          </p>
        </div>

        <div className="terms-block">
          <h2>2. Account Registration</h2>
          <p>
            You must be at least 13 years old to create an account. You are responsible for maintaining the
            confidentiality of your login credentials and for all activities that occur under your account.
          </p>
        </div>

        <div className="terms-block">
          <h2>3. User Conduct</h2>
          <p>
            You agree not to use the site for any unlawful purpose, to harass or harm others, to impersonate
            any person or entity, or to interfere with the proper functioning of the site.
          </p>
        </div>

        <div className="terms-block">
          <h2>4. Intellectual Property</h2>
          <p>
            All content on this site, including games, artwork, text, logos, and code, is the property of
            Deadsmile Games or its licensors and is protected by copyright and other intellectual property laws.
          </p>
        </div>

        <div className="terms-block">
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            Our services are provided “as is” without any warranties, express or implied. We do not guarantee
            that the site will be uninterrupted or error-free.
          </p>
        </div>

        <div className="terms-block">
          <h2>6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Deadsmile Games shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the site.
          </p>
        </div>

        <div className="terms-block">
          <h2>7. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Your continued use of the site after changes are
            posted constitutes your acceptance of the new Terms.
          </p>
        </div>

        <div className="terms-block">
          <h2>8. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>.
          </p>
        </div>

        <p className="terms-page__date">
          <small>Last updated: September 2026</small>
        </p>
      </section>
    </div>
  );
}