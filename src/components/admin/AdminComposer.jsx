import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  X,
  Trash,
  Newspaper,
  FilmStrip,
  GameController,
  List,
  CheckCircle,
  WarningCircle,
  Gear,
  PencilSimple,
  RocketLaunch,
} from '@phosphor-icons/react';

const initial = {
  title: '',
  excerpt: '',
  body: '',
  image: '',
  category: 'Devlog',
  thumbnail: '',
  videoUrl: '',
  durationSeconds: '',
  slug: '',
  shortDescription: '',
  description: '',
  status: 'announced',
  releaseDate: '',
  heroImage: '',
  coverImage: '',
  trailerUrl: '',
  featured: false,
  genres: '',
  platforms: '',
  purchaseUrl: '',
  itchGameId: '',
  downloadUrl: '',
};

function normalizeList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.games)) return response.games;
  if (Array.isArray(response?.news)) return response.news;
  if (Array.isArray(response?.videos)) return response.videos;
  return [];
}

export function AdminComposer() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(null);
  const [openingEdit, setOpeningEdit] = useState(null);
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [manage, setManage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState({
    news: [],
    videos: [],
    games: [],
  });
  const [loadingItems, setLoadingItems] = useState(false);
  const [deleting, setDeleting] = useState(null);

  if (user?.role !== 'admin') return null;

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  function open(typeName) {
    setType(typeName);
    setEditing(null);
    setMenuOpen(false);
    setForm({ ...initial });
    setError('');
    setSaved(false);
  }

  function closeComposer() {
    if (saving) return;
    setType(null);
    setEditing(null);
    setError('');
    setSaved(false);
  }

  async function authedRequest(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err?.status === 401 || err?.code === 'UNAUTHENTICATED') {
        await refresh();
        return fn();
      }
      throw err;
    }
  }

  async function edit(kind, item) {
    if (openingEdit) return;

    setOpeningEdit(`${kind}:${item.id}`);
    setError("");

    try {
        let detail;
        let nextType;
        let nextForm = { ...initial };

        if (kind === "news") {
            detail = await authedRequest(() =>
                api.get(`/news/${encodeURIComponent(item.slug)}`)
            );

            nextType = "newsletter";

            nextForm = {
                ...nextForm,
                title: detail.title || "",
                excerpt: detail.excerpt || "",
                body: detail.body || "",
                image: detail.image || "",
            };
        } else if (kind === "videos") {
            detail = await authedRequest(() =>
                api.get(`/videos/${encodeURIComponent(item.id)}`)
            );

            nextType = "video";

            nextForm = {
                ...nextForm,
                title: detail.title || "",
                category: detail.category || "",
                thumbnail: detail.thumbnail || "",
                videoUrl: detail.video_url || "",
                durationSeconds: detail.duration_seconds ?? "",
            };
        } else if (kind === "games") {
            detail = await authedRequest(() =>
                api.get(`/games/${encodeURIComponent(item.slug)}`)
            );

            nextType = "game";

            nextForm = {
                ...nextForm,
                title: detail.title || "",
                slug: detail.slug || "",
                shortDescription: detail.shortDescription || "",
                description: detail.description || "",
                status: detail.status || "announced",
                releaseDate: detail.releaseDate
                    ? String(detail.releaseDate).slice(0, 10)
                    : "",
                heroImage: detail.heroImage || "",
                coverImage: detail.coverImage || "",
                trailerUrl: detail.trailerUrl || "",
                featured: Boolean(detail.featured),
                genres: (detail.genres || []).join(", "),
                platforms: (detail.platforms || []).join(", "),
                purchaseUrl: detail.purchaseUrl || "",
                itchGameId: detail.itchGameId ?? "",
                downloadUrl: detail.downloadUrl || "",
            };
        } else {
            return;
        }

        setForm(nextForm);
        setEditing({ kind, id: item.id });
        setSaved(false);
        setManage(false);
        setType(nextType);
    } catch (err) {
        setError(
            err?.message ||
            "Unable to load this item for editing."
        );
    } finally {
        setOpeningEdit(null);
    }
}

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      let path, payload;

      if (type === 'newsletter') {
        path = '/admin/newsletter';
        payload = {
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          image: form.image,
        };
      }

      if (type === 'video') {
        path = '/admin/video';
        payload = {
          title: form.title,
          category: form.category,
          thumbnail: form.thumbnail,
          videoUrl: form.videoUrl || null,
          durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null,
        };
      }

      if (type === 'game') {
        path = '/admin/game';
        payload = {
          title: form.title,
          slug: form.slug,
          shortDescription: form.shortDescription,
          description: form.description,
          status: form.status,
          releaseDate: form.releaseDate || null,
          heroImage: form.heroImage,
          coverImage: form.coverImage,
          trailerUrl: form.trailerUrl || null,
          featured: form.featured,
          purchaseUrl: form.purchaseUrl || null,
          itchGameId: form.itchGameId ? Number(form.itchGameId) : null,
          downloadUrl: form.downloadUrl || null,
          genres: form.genres.split(',').map((v) => v.trim()).filter(Boolean),
          platforms: form.platforms.split(',').map((v) => v.trim()).filter(Boolean),
        };
      }

      await authedRequest(() =>
          editing
              ? api.put(
                    `${path}/${encodeURIComponent(editing.id)}`,
                    payload
                )
              : api.post(path, payload)
      );
      setSaved(true);
      window.setTimeout(() => {
        setType(null);
        setEditing(null);
      }, 500);
    } catch (err) {
      setError(err?.message || 'Unable to publish.');
    } finally {
      setSaving(false);
    }
  }

  async function openManage() {
    setManage(true);
    setMenuOpen(false);
    setLoadingItems(true);
    setError('');

    try {
      const [newsResponse, videosResponse, gamesResponse] = await Promise.all([
        api.get('/news', { limit: 48 }),
        api.get('/videos', { limit: 48 }),
        api.get('/games', { page: 1, limit: 48 }),
      ]);

      setItems({
        news: normalizeList(newsResponse),
        videos: normalizeList(videosResponse),
        games: normalizeList(gamesResponse),
      });
    } catch (err) {
      setError(err?.message || 'Unable to load content.');
      setItems({ news: [], videos: [], games: [] });
    } finally {
      setLoadingItems(false);
    }
  }
  const deleteEndpointMap = {
    news: 'newsletter',
    videos: 'video',
    games: 'game',
  };

  async function remove(kind, id) {
    const confirmed = window.confirm(
      'Delete this item permanently? This action cannot be undone.'
    );
    if (!confirmed) return;

    const deleteKey = `${kind}:${id}`;
    setDeleting(deleteKey);
    setError('');

    try {
      const endpoint = deleteEndpointMap[kind];
      if (!endpoint) {
        throw new Error('This content type could not be handled.');
      }
      await authedRequest(() => api.delete(`/admin/${endpoint}/${encodeURIComponent(id)}`));

      setItems((current) => ({
        ...current,
        [kind]: current[kind].filter((item) => item.id !== id),
      }));
    } catch (err) {
      setError(err?.message || 'Unable to delete item.');
    } finally {
      setDeleting(null);
    }
  }

  const sections = [
    { key: 'news', label: 'Newswire' },
    { key: 'videos', label: 'Videos' },
    { key: 'games', label: 'Games' },
  ];

  return (
    <>
      <div className={`admin-composer ${menuOpen ? 'is-open' : ''}`}>
        {menuOpen && (
          <div className="admin-composer__menu" role="menu">
            <div className="admin-composer__label">Manage content</div>
            <button type="button" role="menuitem" onClick={() => open('newsletter')}>
              <Newspaper weight="bold" />
              <span>Newsletter</span>
            </button>
            <button type="button" role="menuitem" onClick={() => open('video')}>
              <FilmStrip weight="bold" />
              <span>Video</span>
            </button>
            <button type="button" role="menuitem" onClick={() => open('game')}>
              <GameController weight="bold" />
              <span>Game</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="admin-composer__manage"
              onClick={openManage}
            >
              <List weight="bold" />
              <span>Manage</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="admin-composer__toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X weight="bold" /> : <Gear weight="bold" size={24} />}
        </button>
      </div>

      <Modal open={!!type} onClose={closeComposer} labelledBy="admin-composer-title">
        <div className="admin-modal">
          <header>
            <div>
              <h2 id="admin-composer-title">
                  {editing ? "Edit" : "Publish"} {type}
              </h2>
            </div>
            <button
              type="button"
              className="admin-modal__close"
              onClick={closeComposer}
              disabled={saving}
              aria-label="Close"
            >
              <X weight="bold" />
            </button>
          </header>

          <form onSubmit={submit}>
            {type === 'newsletter' && (
              <>
                <Field label="Title" value={form.title} onChange={set('title')} required minLength={2} maxLength={180} />
                <Field label="Excerpt" value={form.excerpt} onChange={set('excerpt')} maxLength={500} />
                <Text label="Body" value={form.body} onChange={set('body')} required maxLength={30000} />
                <Field label="Image URL" value={form.image} onChange={set('image')} maxLength={2000} placeholder="https://… or /assets/…" />
              </>
            )}

            {type === 'video' && (
              <>
                <Field label="Title" value={form.title} onChange={set('title')} required minLength={2} maxLength={180} />
                <Field label="Category" value={form.category} onChange={set('category')} required maxLength={80} />
                <Field label="Video URL" type="url" maxLength={2000} value={form.videoUrl} onChange={set('videoUrl')} />
                <Field label="Thumbnail URL" maxLength={2000} value={form.thumbnail} onChange={set('thumbnail')} />
                <Field
                  label="Duration (seconds)"
                  type="number"
                  min="0"
                  max="86400"
                  step="1"
                  value={form.durationSeconds}
                  onChange={set('durationSeconds')}
                />
              </>
            )}

            {type === 'game' && (
              <>
                <Field label="Title" value={form.title} onChange={set('title')} required minLength={2} maxLength={180} />
                <Field label="Slug" value={form.slug} onChange={set('slug')} required minLength={2} maxLength={120} pattern="[a-z0-9-]+" />
                <Text label="Short description" value={form.shortDescription} onChange={set('shortDescription')} required maxLength={500} />
                <Text label="Description" value={form.description} onChange={set('description')} maxLength={30000} />

                <div className="admin-modal__row">
                  <Field
                    label="Status"
                    as="select"
                    value={form.status}
                    onChange={set('status')}
                    options={['announced', 'in_development', 'released']}
                  />
                  <Field label="Release date" type="date" value={form.releaseDate} onChange={set('releaseDate')} />
                </div>

                <Field label="Hero image URL" maxLength={2000} value={form.heroImage} onChange={set('heroImage')} />
                <Field label="Cover image URL" maxLength={2000} value={form.coverImage} onChange={set('coverImage')} />
                <Field label="Trailer URL" type="url" maxLength={2000} value={form.trailerUrl} onChange={set('trailerUrl')} />
                <Field label="Purchase URL" type="url" maxLength={2000} value={form.purchaseUrl} onChange={set('purchaseUrl')} placeholder="https://deadsml.itch.io/game/purchase" />
                <Field label="itch.io game ID" type="number" min="1" value={form.itchGameId} onChange={set('itchGameId')} />
                <Field label="Download URL" type="url" maxLength={2000} value={form.downloadUrl} onChange={set('downloadUrl')} placeholder="https://..." />
                <Field label="Genres (comma separated)" maxLength={509} value={form.genres} onChange={set('genres')} />
                <Field label="Platforms (comma separated)" maxLength={509} value={form.platforms} onChange={set('platforms')} />

                <label className="admin-check">
                  <input type="checkbox" checked={form.featured} onChange={set('featured')} />
                  <span>Feature on homepage</span>
                </label>
              </>
            )}

            {error && (
              <p className="admin-modal__error">
                <WarningCircle weight="bold" />
                <span>{error}</span>
              </p>
            )}

            {saved && (
              <p className="admin-modal__saved">
                <CheckCircle weight="bold" />
                <span>
                    {editing ? "Changes saved." : "Published successfully."}
                </span>
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Save & publish"}
            </Button>
          </form>
        </div>
      </Modal>

      <Modal open={manage} onClose={() => setManage(false)} labelledBy="admin-manage-title">
        <div className="admin-manage">
          <header>
            <div>
              <h2 id="admin-manage-title">Content</h2>
            </div>
            <button type="button" className="admin-modal__close" onClick={() => setManage(false)} aria-label="Close">
              <X weight="bold" />
            </button>
          </header>

          {error && (
            <p className="admin-modal__error">
              <WarningCircle weight="bold" />
              <span>{error}</span>
            </p>
          )}

          {loadingItems ? (
            <p className="admin-manage__loading">Loading content…</p>
          ) : (
            sections.map(({ key, label, icon: Icon }) => {
              const list = items[key] || [];
              return (
                <section key={key} className="admin-manage__section">
                  <div className="admin-manage__section-head">
                    <h3>
                      {label}
                    </h3>
                  </div>

                  {list.length === 0 ? (
                    <p className="admin-manage__empty">No items published.</p>
                  ) : (
                    list.map((item) => {
                      const deleteKey = `${key}:${item.id}`;
                      return (
                        <div className="admin-manage__item" key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                          </div>
                          <div className="admin-manage__item-actions">
                            <button
                              type="button"
                              onClick={() => edit(key, item)}
                              disabled={
                                  Boolean(openingEdit) ||
                                  deleting === deleteKey
                              }
                              className="btn btn--primary"
                              aria-label={`Edit ${item.title}`}
                          >
                              {openingEdit === deleteKey ? (
                                  <span>…</span>
                              ) : (
                                  <PencilSimple weight="bold" />
                              )}
                          </button>
                            <button
                              type="button"
                              onClick={() => remove(key, item.id)}
                              disabled={deleting === deleteKey}
                              className='btn btn--primary'
                              aria-label={`Delete ${item.title}`}
                            >
                              {deleting === deleteKey ? <span>…</span> : <Trash weight="bold" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>
              );
            })
          )}
        </div>
      </Modal>
    </>
  );
}

function Field({ label, as = 'input', options = [], ...props }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {as === 'select' ? (
        <select {...props}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input {...props} />
      )}
    </label>
  );
}

function Text({ label, ...props }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea rows="6" {...props} />
    </label>
  );
}
