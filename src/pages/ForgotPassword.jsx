import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from '@phosphor-icons/react';
import './AuthPages.css';

export function ForgotPassword() {
  const recaptchaRef = useRef(null);

  const [email, setEmail] = useState('');
  const [recaptchaToken, setRecaptchaToken] =
    useState(null);

  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const siteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  function resetRecaptcha() {
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
  }

  function handleRecaptchaChange(token) {
    setError(null);
    setRecaptchaToken(token);
  }

  function handleRecaptchaExpired() {
    resetRecaptcha();
  }

  function handleRecaptchaError() {
    resetRecaptcha();

    setError(
      'Unable to load reCAPTCHA. Please try again.',
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        'Please enter your email address.',
      );
      return;
    }

    if (!recaptchaToken) {
      setError(
        'Please complete the reCAPTCHA verification.',
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post(
        '/auth/forgot-password',
        {
          email: normalizedEmail,
          recaptchaToken,
        },
      );

      setSent(true);
      resetRecaptcha();
    } catch (err) {
      setError(
        err?.message ||
          'Unable to send reset email.',
      );

      resetRecaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <Link
          to="/login"
          className="back-link"
        >
          <ArrowLeft weight="bold" />
          <span>Back</span>
        </Link>

        <h1>Reset password</h1>

        {sent ? (
          <>
            <p
              style={{
                color: '#aaa',
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              If an account exists for{' '}
              <strong>{email}</strong>, we just
              sent a reset link. Check your inbox
              and spam folder.
            </p>

            <Link
              to="/login"
              className="btn btn--primary"
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
          >
            {error && (
              <p
                className="auth-page__error"
                role="alert"
              >
                {error}
              </p>
            )}

            <p
              style={{
                color: '#888',
                fontSize: '0.9rem',
                marginBottom: 20,
              }}
            >
              Enter the email linked to your
              account and we'll send you a link
              to choose a new password.
            </p>

            <div className="auth-page__field">
              <label htmlFor="forgot-email">
                Email
              </label>

              <input
                id="forgot-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="auth-page__recaptcha">
              {siteKey ? (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={siteKey}
                  theme="dark"
                  onChange={
                    handleRecaptchaChange
                  }
                  onExpired={
                    handleRecaptchaExpired
                  }
                  onErrored={
                    handleRecaptchaError
                  }
                />
              ) : (
                <p
                  className="auth-page__error"
                  role="alert"
                >
                  reCAPTCHA is not configured.
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="auth-page__submit"
              disabled={
                submitting ||
                !recaptchaToken ||
                !siteKey
              }
            >
              {submitting
                ? 'Sending…'
                : 'Send reset link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}