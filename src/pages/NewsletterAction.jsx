import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, EnvelopeSimple, WarningCircle } from '@phosphor-icons/react';
import { api } from '../services/api';

function readToken() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

export function NewsletterAction({ action }) {
  const [token] = useState(readToken);
  const [state, setState] = useState({ status: 'loading', message: '' });
  const request = useRef(null);

  useEffect(() => {
    if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname);
    if (!token) {
      setState({ status: 'error', message: 'This newsletter link is incomplete.' });
      return undefined;
    }
    let active = true;
    if (!request.current || request.current.action !== action) {
      request.current = { action, promise: api.post(`/newsletter/${action}`, { token }) };
    }
    request.current.promise
      .then(() => {
        if (!active) return;
        setState({ status: 'success', message: action === 'confirm' ? 'Your subscription is confirmed.' : 'You have been unsubscribed.' });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', message: error?.message || 'This newsletter link could not be processed.' });
      });
    return () => { active = false; };
  }, [action, token]);

  const Icon = state.status === 'success' ? CheckCircle : state.status === 'error' ? WarningCircle : EnvelopeSimple;
  return (
    <section className="newsletter-action page-section">
      <div className="newsletter-action__card">
        <span className={`newsletter-action__icon newsletter-action__icon--${state.status}`}><Icon size={30} weight="bold" /></span>
        <h1>{state.status === 'loading' ? 'Checking your link' : action === 'confirm' ? 'Newsletter confirmation' : 'Newsletter preferences'}</h1>
        <p>{state.status === 'loading' ? 'This will only take a moment.' : state.message}</p>
        {state.status !== 'loading' && <Link className="btn btn--primary" to="/">Return home</Link>}
      </div>
    </section>
  );
}
