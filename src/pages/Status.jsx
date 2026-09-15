import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowClockwise, ArrowLeft, CheckCircle, Cloud, Database, GameController, Globe, Warning } from '@phosphor-icons/react';
import { api } from '../services/api';
import './Status.css';

const icons = { api: Globe, database: Database, itch: GameController };

export function Status() {
  const [state, setState] = useState({ loading: true, data: null, error: false });
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: false }));
    try { setState({ loading: false, data: await api.get('/platform/status'), error: false }); }
    catch { setState({ loading: false, data: null, error: true }); }
  }, []);
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 60_000); return () => window.clearInterval(timer); }, [refresh]);
  const operational = state.data?.status === 'operational';
  return (
    <div className="status-page container">
      <Link to="/" className="back-link"><ArrowLeft weight="bold" /><span>Back</span></Link>
      <header className="status-header">
        <div><h1>Service status</h1><p>Current health of accounts, libraries and Deadsmile Games services.</p></div>
        <button type="button" onClick={refresh} disabled={state.loading}><ArrowClockwise size={18} weight="bold" className={state.loading ? 'spinning' : ''} />Refresh</button>
      </header>
      <section className={`status-overview ${state.error ? 'is-down' : operational ? 'is-up' : 'is-checking'}`}>
        {state.error ? <Warning size={32} weight="bold" /> : operational ? <CheckCircle size={32} weight="bold" /> : <Cloud size={32} weight="bold" />}
        <div><h2>{state.error ? 'Status is temporarily unavailable' : state.loading ? 'Checking services' : operational ? 'All systems operational' : 'Some services are degraded'}</h2><p>{state.error ? 'The status page could not reach the service. Your data is not affected.' : state.data?.checkedAt ? `Checked ${new Date(state.data.checkedAt).toLocaleTimeString()}` : 'This usually takes only a moment.'}</p></div>
      </section>
      <section className="status-components">
        {(state.data?.components || []).map((component) => {
          const Icon = icons[component.id] || Cloud;
          return <article key={component.id}><span className="status-component-icon"><Icon size={21} weight="bold" /></span><div><h3>{component.name}</h3>{component.latencyMs !== undefined && <p>{component.latencyMs} ms response</p>}</div><span className={`status-chip status-chip--${component.status}`}>{component.status === 'external' ? 'External service' : 'Operational'}</span></article>;
        })}
        {!state.data && !state.error && [1,2,3].map((item) => <div className="status-skeleton" key={item} />)}
      </section>
      <section className="status-incidents">
        <div className="status-section-head"><h2>Recent incidents</h2><p>Updates from the last seven days.</p></div>
        {state.data?.incidents?.length ? state.data.incidents.map((incident) => <article key={incident.id}><span>{incident.status}</span><h3>{incident.title}</h3><p>{incident.body}</p><time>{new Date(incident.started_at).toLocaleString()}</time></article>) : <div className="status-empty"><CheckCircle size={23} weight="bold" /><span>No incidents reported in the last seven days.</span></div>}
      </section>
    </div>
  );
}
