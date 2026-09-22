import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from '@phosphor-icons/react';

export function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const recaptchaRef = useRef(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  function update(field) {
    return (e) => {
      setForm((current) => ({
        ...current,
        [field]: e.target.value,
      }));
    };
  }

  function handleRecaptchaChange(token) {
    setRecaptchaToken(token);
    setError(null);
  }

  function handleRecaptchaExpired() {
    setRecaptchaToken(null);
  }

  function handleRecaptchaError() {
    setRecaptchaToken(null);
    setError('Unable to load the reCAPTCHA verification. Please try again.');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!recaptchaSiteKey) {
      setError('Security verification is not configured. Please try again later.');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }

    if (!/^[A-Za-z0-9_]{3,24}$/.test(form.username.trim())) {
      setError('Username may only contain letters, numbers and underscores.');
      return;
    }

    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Password must include at least one letter and one number.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        recaptchaToken,
      });

      navigate('/account', { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to create your account.');
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <Link to="/login" className="back-link">
          <ArrowLeft weight="bold" />
          <span>Back</span>
        </Link>

        <h1>{t('auth.register')}</h1>

        {error && (
          <p className="auth-page__error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-page__field">
            <label htmlFor="username">
              {t('auth.username')}
            </label>

            <input
              id="username"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_\-]+"
              value={form.username}
              onChange={update('username')}
              autoComplete="username"
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="reg-email">
              {t('auth.email')}
            </label>

            <input
              id="reg-email"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="reg-password">
              {t('auth.password')}
            </label>

            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="confirmPassword">
              {t('auth.confirm')}
            </label>

            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-page__recaptcha">
            {recaptchaSiteKey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={handleRecaptchaChange}
                theme="dark"
                onExpired={handleRecaptchaExpired}
                onErrored={handleRecaptchaError}
              />
            ) : (
              <p className="auth-page__error" role="alert">
                Security verification is unavailable.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="auth-page__submit"
            disabled={submitting || !recaptchaToken}
          >
            {submitting ? t('auth.creating') : t('auth.create')}
          </Button>
        </form>

        <p className="auth-page__footer">
          {t('auth.existing')}{' '}
          <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
