import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'deadsmile-cookie-consent';

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePreference(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {}
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readPreference();
    if (stored === 'accepted') {
      setVisible(false);
    } else if (stored === 'declined') {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    writePreference('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    writePreference('declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <div className="cookie-consent__inner">
        <div className="cookie-consent__message">
          <p>
            Deadsmile Games uses essential session and security cookies when you sign in. Your choice here stores this preference locally; third-party security services such as reCAPTCHA may still be required on protected forms.
          </p>
        </div>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--accept"
            onClick={handleAccept}
          >
            Accept preference
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--decline"
            onClick={handleDecline}
          >
            Decline optional preference
          </button>
          <Link to="/privacy" className="cookie-consent__link">
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}