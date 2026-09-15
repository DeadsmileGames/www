import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CaretDown, ChatCircle, Envelope, GameController, Headset, ShieldCheck } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import './Support.css';

const faqs = [
  ['How are game updates installed?', 'The launcher checks supported games before play and offers an update without replacing the active installation until the new build is ready.'],
  ['My itch.io game is not showing. What should I do?', 'Refresh your linked library from account settings. A game not found is shown separately from a temporary connection problem.'],
  ['How do cloud saves work?', 'Supported games synchronize their save before and after play. If both copies changed, the newer cloud copy is kept until you choose what to replace.'],
  ['Where are purchases handled?', 'Purchases are completed and owned on itch.io. Deadsmile Games stores only the verified entitlement needed for your library.'],
];

export function Support() {
  const { push } = useToast();
  const [open, setOpen] = useState(0);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ email: '', category: 'technical', message: '' });
  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setSending(true);
    try {
      await api.post('/support', form);
      setForm((current) => ({ ...current, message: '' }));
      push('Your message was sent. We will reply by email.', 'success');
    } catch { push('Your message could not be sent right now. Please try again shortly.', 'error'); }
    finally { setSending(false); }
  }
  return (
    <div className="support-page container">
      <Link to="/" className="back-link"><ArrowLeft weight="bold" /><span>Back</span></Link>
      <header className="support-hero"><div><h1>How can we help?</h1><p>Account, purchase, launcher and game support from Deadsmile Games.</p></div><Headset size={58} weight="bold" /></header>
      <section className="support-quick-grid">
        <Link to="/status"><ShieldCheck size={25} weight="bold" /><div><strong>Service status</strong><span>Check systems and incidents</span></div><ArrowUpRight size={18} weight="bold" /></Link>
        <a href="mailto:deadsmilegames@gmail.com"><Envelope size={25} weight="bold" /><div><strong>Email support</strong><span>deadsmilegames@gmail.com</span></div><ArrowUpRight size={18} weight="bold" /></a>
        <Link to="/games"><GameController size={25} weight="bold" /><div><strong>Game catalog</strong><span>Open a game support page</span></div><ArrowUpRight size={18} weight="bold" /></Link>
      </section>
      <div className="support-layout">
        <section className="support-faq-panel"><div className="support-section-title"><h2>Common questions</h2><p>Fast answers for the most frequent issues.</p></div>{faqs.map(([question, answer], index) => <article key={question}><button type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}><span>{question}</span><CaretDown size={18} weight="bold" /></button>{open === index && <p>{answer}</p>}</article>)}</section>
        <section className="support-contact-panel"><ChatCircle size={28} weight="bold" /><h2>Contact support</h2><p>Describe what happened without including passwords, tokens or payment details.</p><form onSubmit={submit}><label>Email<input type="email" required maxLength="254" value={form.email} onChange={change('email')} autoComplete="email" /></label><label>Category<select value={form.category} onChange={change('category')}><option value="technical">Technical issue</option><option value="account">Account</option><option value="purchase">Purchase</option><option value="game">Game</option><option value="faq">FAQ</option><option value="other">Other</option></select></label><label>Message<textarea required minLength="10" maxLength="5000" rows="6" value={form.message} onChange={change('message')} /></label><button className="btn btn--primary" disabled={sending}><span>{sending ? 'Sending…' : 'Send message'}</span><ArrowUpRight size={18} weight="bold" /></button></form></section>
      </div>
    </div>
  );
}
