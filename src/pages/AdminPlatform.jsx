import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CloudArrowUp, GameController, Key, Pulse, RocketLaunch, Ticket, Trophy, Warning } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import './AdminPlatform.css';

const emptyBuild = {
  gameId: '',
  channelId: '',
  version: '',
  platform: 'windows',
  architecture: 'x64',
  itchChannel: '',
  downloadUrl: '',
  sha256: '',
  sizeBytes: '',
  notes: '',
  status: 'draft',
};

const emptyChannel = { gameId: '', name: 'stable', label: 'Stable', public: true };
const emptyAchievement = { gameId: '', key: '', title: '', description: '', iconUrl: '', points: '0', hidden: false };
const emptyBeta = { userId: '', gameId: '', channelId: '', expiresAt: '' };
const emptyIncident = { title: '', body: '', severity: 'notice', status: 'investigating' };

export function AdminPlatform() {
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [build, setBuild] = useState(emptyBuild);
  const [channel, setChannel] = useState(emptyChannel);
  const [achievement, setAchievement] = useState(emptyAchievement);
  const [beta, setBeta] = useState(emptyBeta);
  const [incident, setIncident] = useState(emptyIncident);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api.get('/admin/platform'));
    } catch {
      push('The release dashboard could not be loaded.', 'error');
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  if (user?.role !== 'admin') return <div className="admin-platform container"><h1>Access unavailable.</h1></div>;

  const change = (setter, key) => (event) => setter((current) => ({ ...current, [key]: event.target.value }));
  const toggle = (setter, key) => (event) => setter((current) => ({ ...current, [key]: event.target.checked }));

  async function run(name, action, success, failure) {
    setBusy(name);
    try {
      await action();
      push(success, 'success');
      await load();
    } catch (error) {
      push(error?.message || failure, 'error');
    } finally {
      setBusy('');
    }
  }

  async function submitBuild(event) {
    event.preventDefault();
    await run('build', async () => {
      await api.post('/admin/platform/builds', {
        gameId: build.gameId,
        channelId: Number(build.channelId),
        version: build.version.trim(),
        platform: build.platform,
        architecture: build.architecture.trim(),
        itchChannel: build.itchChannel.trim() || null,
        downloadUrl: build.downloadUrl.trim() || null,
        sha256: build.sha256.trim().toLowerCase() || null,
        sizeBytes: build.sizeBytes === '' ? null : Number(build.sizeBytes),
        notes: build.notes,
        status: build.status,
      });
      setBuild(emptyBuild);
    }, 'Build saved to the release dashboard.', 'The build could not be saved. Review the fields and try again.');
  }

  async function submitChannel(event) {
    event.preventDefault();
    await run('channel', async () => {
      await api.post('/admin/platform/channels', { ...channel, label: channel.label.trim() });
      setChannel(emptyChannel);
    }, 'Release channel saved.', 'The release channel could not be saved.');
  }

  async function submitAchievement(event) {
    event.preventDefault();
    await run('achievement', async () => {
      await api.post('/admin/platform/achievements', {
        ...achievement,
        key: achievement.key.trim(),
        title: achievement.title.trim(),
        description: achievement.description,
        iconUrl: achievement.iconUrl.trim() || null,
        points: Number(achievement.points),
      });
      setAchievement(emptyAchievement);
    }, 'Achievement saved.', 'The achievement could not be saved.');
  }

  async function submitBeta(event) {
    event.preventDefault();
    await run('beta', async () => {
      await api.post('/admin/platform/beta', {
        userId: beta.userId.trim(),
        gameId: beta.gameId,
        channelId: Number(beta.channelId),
        expiresAt: beta.expiresAt ? new Date(beta.expiresAt).toISOString() : null,
      });
      setBeta(emptyBeta);
    }, 'Beta access saved.', 'Beta access could not be saved.');
  }

  async function submitIncident(event) {
    event.preventDefault();
    await run('incident', async () => {
      await api.post('/admin/platform/incidents', incident);
      setIncident(emptyIncident);
    }, 'Status update published.', 'The status update could not be published.');
  }

  const channelsFor = (gameId) => (data?.channels || []).filter((item) => !gameId || item.game_id === gameId);
  const openTickets = (data?.support || []).reduce((sum, item) => sum + (item.status === 'open' ? item.count : 0), 0);
  const events = (data?.telemetry || []).reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="admin-platform container">
      <Link to="/account" className="back-link"><ArrowLeft weight="bold" />Account</Link>
      <header><div><h1>Release control</h1><p>Builds, channels, achievements, beta access, service health and player support for Deadsmile Games.</p></div><RocketLaunch size={52} weight="bold" /></header>
      <section className="admin-platform__stats">
        <div><GameController weight="bold" /><strong>{data?.games?.length || 0}</strong><span>Games</span></div>
        <div><CloudArrowUp weight="bold" /><strong>{data?.builds?.length || 0}</strong><span>Builds</span></div>
        <div><Ticket weight="bold" /><strong>{openTickets}</strong><span>Open tickets</span></div>
        <div><Pulse weight="bold" /><strong>{events}</strong><span>Diagnostics · 30 days</span></div>
      </section>

      <div className="admin-platform__layout">
        <section className="admin-platform__panel">
          <h2>Release channel</h2>
          <form onSubmit={submitChannel}>
            <label>Game<select required value={channel.gameId} onChange={change(setChannel, 'gameId')}><option value="">Select a game</option>{data?.games?.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
            <div><label>Channel<select value={channel.name} onChange={change(setChannel, 'name')}><option value="stable">Stable</option><option value="beta">Beta</option><option value="internal">Internal</option></select></label><label>Label<input required minLength={2} maxLength={60} value={channel.label} onChange={change(setChannel, 'label')} /></label></div>
            <label className="admin-platform__check"><input type="checkbox" checked={channel.public} onChange={toggle(setChannel, 'public')} />Public channel</label>
            <button className="btn btn--primary" disabled={busy === 'channel'}>{busy === 'channel' ? 'Saving…' : 'Save channel'}</button>
          </form>
        </section>

        <section className="admin-platform__panel">
          <h2>Register build</h2>
          <form onSubmit={submitBuild}>
            <label>Game<select required value={build.gameId} onChange={(event) => setBuild((current) => ({ ...current, gameId: event.target.value, channelId: '' }))}><option value="">Select a game</option>{data?.games?.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
            <label>Channel<select required value={build.channelId} onChange={change(setBuild, 'channelId')}><option value="">Select a channel</option>{channelsFor(build.gameId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <div><label>Version<input required maxLength={40} value={build.version} onChange={change(setBuild, 'version')} /></label><label>Platform<select value={build.platform} onChange={change(setBuild, 'platform')}><option value="windows">Windows</option><option value="linux">Linux</option><option value="macos">macOS</option></select></label></div>
            <div><label>Architecture<input required minLength={2} maxLength={20} pattern="[A-Za-z0-9_-]+" value={build.architecture} onChange={change(setBuild, 'architecture')} /></label><label>Status<select value={build.status} onChange={change(setBuild, 'status')}><option value="draft">Draft</option><option value="published">Published</option><option value="retired">Retired</option></select></label></div>
            <label>itch.io channel<input maxLength={120} pattern="[A-Za-z0-9._-]*" value={build.itchChannel} onChange={change(setBuild, 'itchChannel')} placeholder="windows-stable" /></label>
            <label>Direct URL<input type="url" maxLength={2000} value={build.downloadUrl} onChange={change(setBuild, 'downloadUrl')} placeholder="https://…" /></label>
            <label>SHA-256<input maxLength={64} minLength={build.sha256 ? 64 : undefined} pattern="[a-fA-F0-9]{64}" value={build.sha256} onChange={change(setBuild, 'sha256')} placeholder="64 hexadecimal characters" /></label>
            <label>Size in bytes<input type="number" min="0" step="1" value={build.sizeBytes} onChange={change(setBuild, 'sizeBytes')} /></label>
            <label>Release notes<textarea rows="4" maxLength={10000} value={build.notes} onChange={change(setBuild, 'notes')} /></label>
            <button className="btn btn--primary" disabled={busy === 'build'}>{busy === 'build' ? 'Saving…' : 'Save build'}</button>
          </form>
        </section>

        <section className="admin-platform__panel">
          <h2><Trophy size={22} weight="bold" /> Achievement</h2>
          <form onSubmit={submitAchievement}>
            <label>Game<select required value={achievement.gameId} onChange={change(setAchievement, 'gameId')}><option value="">Select a game</option>{data?.games?.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
            <div><label>Key<input required minLength={2} maxLength={80} pattern="[a-z0-9_]+" value={achievement.key} onChange={change(setAchievement, 'key')} placeholder="first_step" /></label><label>Points<input type="number" min="0" max="1000" step="1" value={achievement.points} onChange={change(setAchievement, 'points')} /></label></div>
            <label>Title<input required minLength={2} maxLength={120} value={achievement.title} onChange={change(setAchievement, 'title')} /></label>
            <label>Description<textarea rows="3" maxLength={500} value={achievement.description} onChange={change(setAchievement, 'description')} /></label>
            <label>Icon URL<input maxLength={2000} value={achievement.iconUrl} onChange={change(setAchievement, 'iconUrl')} placeholder="https://…" /></label>
            <label className="admin-platform__check"><input type="checkbox" checked={achievement.hidden} onChange={toggle(setAchievement, 'hidden')} />Hidden achievement</label>
            <button className="btn btn--primary" disabled={busy === 'achievement'}>{busy === 'achievement' ? 'Saving…' : 'Save achievement'}</button>
          </form>
        </section>

        <section className="admin-platform__panel">
          <h2><Key size={22} weight="bold" /> Beta access</h2>
          <form onSubmit={submitBeta}>
            <label>User UUID<input required pattern="[0-9a-fA-F-]{36}" maxLength={36} value={beta.userId} onChange={change(setBeta, 'userId')} /></label>
            <label>Game<select required value={beta.gameId} onChange={(event) => setBeta((current) => ({ ...current, gameId: event.target.value, channelId: '' }))}><option value="">Select a game</option>{data?.games?.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
            <label>Channel<select required value={beta.channelId} onChange={change(setBeta, 'channelId')}><option value="">Select a channel</option>{channelsFor(beta.gameId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label>Expires at<input type="datetime-local" value={beta.expiresAt} onChange={change(setBeta, 'expiresAt')} /></label>
            <button className="btn btn--primary" disabled={busy === 'beta'}>{busy === 'beta' ? 'Saving…' : 'Grant beta access'}</button>
          </form>
        </section>

        <section className="admin-platform__panel">
          <h2>Service update</h2>
          <form onSubmit={submitIncident}>
            <label>Title<input required minLength={2} maxLength={180} value={incident.title} onChange={change(setIncident, 'title')} /></label>
            <label>Message<textarea rows="4" maxLength={5000} value={incident.body} onChange={change(setIncident, 'body')} /></label>
            <div><label>Severity<select value={incident.severity} onChange={change(setIncident, 'severity')}><option value="notice">Notice</option><option value="degraded">Degraded</option><option value="outage">Outage</option></select></label><label>Status<select value={incident.status} onChange={change(setIncident, 'status')}><option value="investigating">Investigating</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option></select></label></div>
            <button className="btn btn--primary" disabled={busy === 'incident'}>{busy === 'incident' ? 'Publishing…' : 'Publish update'}</button>
          </form>
          <div className="admin-platform__incidents">{data?.incidents?.slice(0, 5).map((item) => <article key={item.id}>{item.status === 'resolved' ? <CheckCircle weight="bold" /> : item.severity === 'outage' ? <Warning weight="bold" /> : <Pulse weight="bold" />}<div><strong>{item.title}</strong><span>{item.status}</span></div></article>)}</div>
        </section>
      </div>
    </div>
  );
}
