import { useLanguage } from "../../context/LanguageContext";
import { SkeletonRows } from "../ui/Skeleton";
import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { api, friendlyErrorMessage } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
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
} from "@phosphor-icons/react";

const initial = {
  title: "",
  excerpt: "",
  body: "",
  image: "",
  category: "Devlog",
  thumbnail: "",
  thumbnailEn: "",
  thumbnailPtBr: "",
  thumbnailEs: "",
  videoUrl: "",
  durationSeconds: "",
  slug: "",
  shortDescription: "",
  description: "",
  status: "announced",
  releaseDate: "",
  heroImage: "",
  coverImage: "",
  trailerUrl: "",
  featured: false,
  genres: "",
  platforms: "",
  accessType: "free",
  itchUrl: "",
  microsoftStoreBadge: "",
  gameId: "",
  purchaseUrl: "",
  itchGameId: "",
  downloadUrl: "",
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
  const { t } = useLanguage();
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(null);
  const [openingEdit, setOpeningEdit] = useState(null);
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  if (user?.role !== "admin") return null;

  const set = (key) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function loadGameOptions() {
    const games = [];
    for (let page = 1; page <= 1000; page++) {
      const data = await api.get("/games", { page, limit: 48 });
      games.push(...normalizeList(data));
      if (page >= data.pagination.totalPages) break;
    }
    setItems((current) => ({ ...current, games }));
  }

  function open(typeName) {
    setType(typeName);
    setEditing(null);
    setMenuOpen(false);
    setForm({ ...initial });
    setError("");
    setSaved(false);
    if (typeName === "newsletter")
      loadGameOptions().catch((error) => setError(friendlyErrorMessage(error)));
  }

  function closeComposer() {
    if (saving) return;
    setType(null);
    setEditing(null);
    setError("");
    setSaved(false);
  }

  async function authedRequest(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err?.status === 401 || err?.code === "UNAUTHENTICATED") {
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
        await loadGameOptions();
        detail = await authedRequest(() =>
          api.get(`/newswire/${encodeURIComponent(item.slug)}`),
        );

        nextType = "newsletter";

        nextForm = {
          ...nextForm,
          title: detail.title || "",
          excerpt: detail.excerpt || "",
          body: detail.body || "",
          image: detail.image || "",
          gameId: detail.game_id || "",
        };
      } else if (kind === "videos") {
        detail = await authedRequest(() =>
          api.get(`/videos/${encodeURIComponent(item.id)}`),
        );

        nextType = "video";

        nextForm = {
          ...nextForm,
          title: detail.title || "",
          category: detail.category || "",
          thumbnail: detail.thumbnail || "",
          thumbnailEn: detail.thumbnail_en || "",
          thumbnailPtBr: detail.thumbnail_pt_br || "",
          thumbnailEs: detail.thumbnail_es || "",
          videoUrl: detail.video_url || "",
          durationSeconds: detail.duration_seconds ?? "",
        };
      } else if (kind === "games") {
        detail = await authedRequest(() =>
          api.get(`/admin/game/${encodeURIComponent(item.id)}`),
        );

        nextType = "game";

        nextForm = {
          ...nextForm,
          title: detail.title || "",
          slug: detail.slug || "",
          shortDescription: detail.shortDescription || "",
          description: detail.description || "",
          status: detail.status || "announced",
          releaseDate: detail.releaseDate ? String(detail.releaseDate).slice(0, 10) : "",
          heroImage: detail.heroImage || "",
          coverImage: detail.coverImage || "",
          trailerUrl: detail.trailerUrl || "",
          featured: Boolean(detail.featured),
          genres: (detail.genres || []).join(", "),
          platforms: (detail.platforms || []).join(", "),
          accessType: detail.accessType || "free",
          itchUrl: detail.itchUrl || "",
          microsoftStoreBadge: detail.microsoftStoreBadgeHtml || "",
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
      setError(friendlyErrorMessage(err));
    } finally {
      setOpeningEdit(null);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (
      type === "newsletter" &&
      !String(form.body || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
    ) {
      setError(t("Body is required."));
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      let path, payload;

      if (type === "newsletter") {
        path = "/admin/newsletter";
        payload = {
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          image: form.image,
          gameId: form.gameId || null,
        };
      }

      if (type === "video") {
        path = "/admin/video";
        payload = {
          title: form.title,
          category: form.category,
          thumbnail: form.thumbnail,
          thumbnailEn: form.thumbnailEn,
          thumbnailPtBr: form.thumbnailPtBr,
          thumbnailEs: form.thumbnailEs,
          videoUrl: form.videoUrl || null,
          durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null,
        };
      }

      if (type === "game") {
        path = "/admin/game";
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
          accessType: form.accessType,
          itchUrl: form.itchUrl || null,
          microsoftStoreBadge: form.microsoftStoreBadge || null,
          purchaseUrl: form.purchaseUrl || null,
          itchGameId: form.itchGameId ? Number(form.itchGameId) : null,
          downloadUrl: form.downloadUrl || null,
          genres: form.genres
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          platforms: form.platforms
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        };
      }

      await authedRequest(() =>
        editing
          ? api.put(`${path}/${encodeURIComponent(editing.id)}`, payload)
          : api.post(path, payload),
      );
      setSaved(true);
      if (manage) await openManage();
      window.setTimeout(() => {
        setType(null);
        setEditing(null);
      }, 500);
    } catch (err) {
      setError(
        err.fields?.length
          ? err.fields.map((item) => item.message).join("\n")
          : friendlyErrorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  }

  async function openManage() {
    setManage(true);
    setMenuOpen(false);
    setLoadingItems(true);
    setError("");

    try {
      const [newsResponse, videosResponse, gamesResponse] = await Promise.all([
        api.get("/newswire", { limit: 48 }),
        api.get("/videos", { limit: 48 }),
        api.get("/games", { page: 1, limit: 48 }),
      ]);

      setItems({
        news: normalizeList(newsResponse),
        videos: normalizeList(videosResponse),
        games: normalizeList(gamesResponse),
      });
    } catch (err) {
      setError(
        err.fields?.length
          ? err.fields.map((item) => item.message).join("\n")
          : friendlyErrorMessage(err),
      );
      setItems({ news: [], videos: [], games: [] });
    } finally {
      setLoadingItems(false);
    }
  }
  const deleteEndpointMap = {
    news: "newsletter",
    videos: "video",
    games: "game",
  };

  async function remove(kind, id) {
    const confirmed = window.confirm(
      t("Delete this item permanently? This action cannot be undone."),
    );
    if (!confirmed) return;

    const deleteKey = `${kind}:${id}`;
    setDeleting(deleteKey);
    setError("");

    try {
      const endpoint = deleteEndpointMap[kind];
      if (!endpoint) {
        throw new Error("This content type could not be handled.");
      }
      await authedRequest(() =>
        api.delete(`/admin/${endpoint}/${encodeURIComponent(id)}`),
      );

      setItems((current) => ({
        ...current,
        [kind]: current[kind].filter((item) => item.id !== id),
      }));
    } catch (err) {
      setError(
        err.fields?.length
          ? err.fields.map((item) => item.message).join("\n")
          : friendlyErrorMessage(err),
      );
    } finally {
      setDeleting(null);
    }
  }

  const sections = [
    { key: "news", label: t("Newswire") },
    { key: "videos", label: t("Videos") },
    { key: "games", label: t("Games") },
  ];

  return (
    <>
      <div className="admin-composer">
        {menuOpen && (
          <div className="admin-composer__menu" role="menu">
            <div className="admin-composer__label">{t("Manage content")}</div>
            <button type="button" role="menuitem" onClick={() => open("newsletter")}>
              <Newspaper weight="bold" />
              <span>{t("Newsletter")}</span>
            </button>
            <button type="button" role="menuitem" onClick={() => open("video")}>
              <FilmStrip weight="bold" />
              <span>{t("Video")}</span>
            </button>
            <button type="button" role="menuitem" onClick={() => open("game")}>
              <GameController weight="bold" />
              <span>{t("Game")}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="admin-composer__manage"
              onClick={openManage}
            >
              <List weight="bold" />
              <span>{t("Manage")}</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="admin-composer__toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? t("Close admin menu") : t("Open admin menu")}
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
                {editing ? t("Edit") : t("Publish")} {type}
              </h2>
            </div>
            <button
              type="button"
              className="admin-modal__close"
              onClick={closeComposer}
              disabled={saving}
              aria-label={t("Close")}
            >
              <X weight="bold" />
            </button>
          </header>

          <form onSubmit={submit}>
            {type === "newsletter" && (
              <>
                <Field
                  label={t("Title")}
                  value={form.title}
                  onChange={set("title")}
                  required
                  minLength={2}
                  maxLength={180}
                />
                <Field
                  label={t("Excerpt")}
                  value={form.excerpt}
                  onChange={set("excerpt")}
                  maxLength={500}
                />
                <label className="admin-field">
                  <span>{t("Related game")}</span>
                  <select value={form.gameId} onChange={set("gameId")}>
                    <option value="">{t("None")}</option>
                    {items.games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </label>
                <NewswireBodyEditor
                  label={t("Body")}
                  value={form.body}
                  onChange={(value) => setForm((current) => ({ ...current, body: value }))}
                  maxLength={30000}
                />
                <Field
                  label={t("Image URL")}
                  value={form.image}
                  onChange={set("image")}
                  maxLength={2000}
                  placeholder="https://… /assets/…"
                />
              </>
            )}

            {type === "video" && (
              <>
                <Field
                  label={t("Title")}
                  value={form.title}
                  onChange={set("title")}
                  required
                  minLength={2}
                  maxLength={180}
                />
                <Field
                  label={t("Category")}
                  value={form.category}
                  onChange={set("category")}
                  required
                  maxLength={80}
                />
                <Field
                  label={t("Video URL")}
                  type="url"
                  maxLength={2000}
                  value={form.videoUrl}
                  onChange={set("videoUrl")}
                />
                <Field
                  label={t("Thumbnail URL")}
                  maxLength={2000}
                  value={form.thumbnail}
                  onChange={set("thumbnail")}
                />
                <Field
                  label={t("Thumbnail URL (English)")}
                  maxLength={2000}
                  value={form.thumbnailEn}
                  onChange={set("thumbnailEn")}
                  placeholder="https://…"
                />
                <Field
                  label={t("Thumbnail URL (Portuguese)")}
                  maxLength={2000}
                  value={form.thumbnailPtBr}
                  onChange={set("thumbnailPtBr")}
                  placeholder="https://…"
                />
                <Field
                  label={t("Thumbnail URL (Spanish)")}
                  maxLength={2000}
                  value={form.thumbnailEs}
                  onChange={set("thumbnailEs")}
                  placeholder="https://…"
                />
                <Field
                  label={t("Duration (seconds)")}
                  type="number"
                  min="0"
                  max="86400"
                  step="1"
                  value={form.durationSeconds}
                  onChange={set("durationSeconds")}
                />
              </>
            )}

            {type === "game" && (
              <>
                <Field
                  label={t("Title")}
                  value={form.title}
                  onChange={set("title")}
                  required
                  minLength={2}
                  maxLength={180}
                />
                <Field
                  label={t("Slug")}
                  value={form.slug}
                  onChange={set("slug")}
                  required
                  minLength={2}
                  maxLength={120}
                  pattern="[a-z0-9-]+"
                />
                <Text
                  label={t("Short description")}
                  value={form.shortDescription}
                  onChange={set("shortDescription")}
                  required
                  maxLength={500}
                />
                <Text
                  label={t("Description")}
                  value={form.description}
                  onChange={set("description")}
                  maxLength={30000}
                />

                <div className="admin-modal__row">
                  <Field
                    label={t("Status")}
                    as="select"
                    value={form.status}
                    onChange={set("status")}
                    options={["announced", "in_development", "released"]}
                  />

                  <Field
                    label={t("Release date")}
                    type="date"
                    value={form.releaseDate}
                    onChange={set("releaseDate")}
                  />
                </div>

                <Field
                  label={t("Hero image URL")}
                  maxLength={2000}
                  value={form.heroImage}
                  onChange={set("heroImage")}
                />
                <Field
                  label={t("Cover image URL")}
                  maxLength={2000}
                  value={form.coverImage}
                  onChange={set("coverImage")}
                />
                <Field
                  label={t("Trailer URL")}
                  type="url"
                  maxLength={2000}
                  value={form.trailerUrl}
                  onChange={set("trailerUrl")}
                />
                <label className="admin-field">
                  <span>{t("Access")}</span>
                  <select value={form.accessType} onChange={set("accessType")}>
                    <option value="free">{t("Free")}</option>
                    <option value="paid">{t("Paid")}</option>
                  </select>
                </label>
                <Field
                  label={t("itch.io game page (optional)")}
                  type="url"
                  value={form.itchUrl}
                  onChange={set("itchUrl")}
                  maxLength={2000}
                />
                <Text
                  label={t("Microsoft Store badge HTML (optional)")}
                  value={form.microsoftStoreBadge}
                  onChange={set("microsoftStoreBadge")}
                  maxLength={4000}
                />
                <Field
                  label={t("Purchase URL")}
                  type="url"
                  maxLength={2000}
                  value={form.purchaseUrl}
                  onChange={set("purchaseUrl")}
                  placeholder="https://deadsml.itch.io/game/purchase"
                />
                <Field
                  label={t("itch.io game ID")}
                  type="number"
                  min="1"
                  value={form.itchGameId}
                  onChange={set("itchGameId")}
                />
                <Field
                  label={t("Download URL")}
                  type="url"
                  maxLength={2000}
                  value={form.downloadUrl}
                  onChange={set("downloadUrl")}
                  placeholder="https://..."
                />
                <Field
                  label={t("Genres (comma separated)")}
                  maxLength={509}
                  value={form.genres}
                  onChange={set("genres")}
                />
                <Field
                  label={t("Platforms (comma separated)")}
                  maxLength={509}
                  value={form.platforms}
                  onChange={set("platforms")}
                />

                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={set("featured")}
                  />
                  <span>{t("Feature on homepage")}</span>
                </label>
              </>
            )}

            {error && (
              <p className="admin-modal__error">
                <WarningCircle weight="bold" />
                <span>{t(error)}</span>
              </p>
            )}

            {saved && (
              <p className="admin-modal__saved">
                <CheckCircle weight="bold" />
                <span>
                  {editing ? t("Changes saved.") : t("Published successfully.")}
                </span>
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? (
                <><LoadingSpinner />{t("Saving\u2026")}</>
              ) : editing ? (
                t("Save changes")
              ) : (
                t("Save & publish")
              )}
            </Button>
          </form>
        </div>
      </Modal>

      <Modal
        open={manage}
        onClose={() => setManage(false)}
        labelledBy="admin-manage-title"
      >
        <div className="admin-manage">
          <header>
            <div>
              <h2 id="admin-manage-title">{t("Content")}</h2>
            </div>
            <button
              type="button"
              className="admin-modal__close"
              onClick={() => setManage(false)}
              aria-label={t("Close")}
            >
              <X weight="bold" />
            </button>
          </header>

          {error && (
            <p className="admin-modal__error">
              <WarningCircle weight="bold" />
              <span>{t(error)}</span>
            </p>
          )}

          {loadingItems ? (
            <SkeletonRows />
          ) : (
            sections.map(({ key, label, icon: Icon }) => {
              const list = items[key] || [];
              return (
                <section key={key} className="admin-manage__section">
                  <div className="admin-manage__section-head">
                    <h3>{label}</h3>
                  </div>

                  {list.length === 0 ? (
                    <p className="admin-manage__empty">{t("No items published.")}</p>
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
                              disabled={Boolean(openingEdit) || deleting === deleteKey}
                              className="btn btn--secondary"
                              aria-busy={openingEdit === deleteKey}
                              aria-label={t("Edit {0}", { 0: item.title })}
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
                              aria-busy={deleting === deleteKey}
                              className="btn btn--danger"
                              aria-label={t("Delete {0}", { 0: item.title })}
                            >
                              {deleting === deleteKey ? (
                                <span>…</span>
                              ) : (
                                <Trash weight="bold" />
                              )}
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

function Field({ label, as = "input", options = [], ...props }) {
  const { t } = useLanguage();
  return (
    <label className="admin-field">
      <span>{label}</span>
      {as === "select" ? (
        <select {...props}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {t(opt)}
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

function NewswireBodyEditor({ label, value, onChange, maxLength }) {
  const { t } = useLanguage();
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== (value || "")) editor.innerHTML = value || "";
  }, [value]);

  function rememberSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function openLinkForm(event) {
    event.preventDefault();
    rememberSelection();
    const selection = window.getSelection();
    const editor = editorRef.current;
    const hasSelection =
      editor &&
      selection?.rangeCount &&
      editor.contains(selection.getRangeAt(0).commonAncestorContainer) &&
      !selection.getRangeAt(0).collapsed;
    setLinkText(hasSelection ? selection.toString() : "");
    setLinkUrl("");
    setLinkError("");
    setLinkFormOpen((open) => !open);
  }

  function insertLink(event) {
    event.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    let href = linkUrl.trim();
    if (/^www\./i.test(href)) href = `https://${href}`;

    let parsed;
    try {
      parsed = new URL(href);
    } catch {
      parsed = null;
    }
    if (!parsed || !["https:", "http:", "mailto:"].includes(parsed.protocol)) {
      setLinkError(t("Enter a valid URL."));
      return;
    }

    let range = savedRangeRef.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();

    const anchor = document.createElement("a");
    anchor.href = parsed.href;
    anchor.textContent = linkText.trim() || href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    range.insertNode(anchor);

    const spacer = document.createTextNode(" ");
    anchor.after(spacer);
    range.setStartAfter(spacer);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.focus();
    onChange(editor.innerHTML);

    savedRangeRef.current = range.cloneRange();
    setLinkFormOpen(false);
    setLinkText("");
    setLinkUrl("");
    setLinkError("");
  }

  return (
    <div className="admin-field admin-rich-editor-field">
      <span>{label}</span>
      <div
        ref={editorRef}
        className="admin-rich-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        aria-required="true"
        onPaste={(event) => {
          event.preventDefault();
          const editor = editorRef.current;
          const pastedText = event.clipboardData?.getData("text/plain");
          if (!editor || typeof pastedText !== "string" || !pastedText) return;

          const selection = window.getSelection();
          let range =
            selection?.rangeCount &&
            editor.contains(selection.getRangeAt(0).commonAncestorContainer)
              ? selection.getRangeAt(0)
              : null;
          if (!range) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
          }

          range.deleteContents();
          const fragment = document.createDocumentFragment();
          const lines = pastedText.replace(/\\r\\n?/g, "\\n").split("\\n");
          lines.forEach((line, index) => {
            if (index) fragment.append(document.createElement("br"));
            fragment.append(document.createTextNode(line));
          });
          const lastNode = fragment.lastChild;
          range.insertNode(fragment);
          if (lastNode) {
            range.setStartAfter(lastNode);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }

          if (editor.textContent.length > maxLength) {
            editor.innerHTML = value || "";
            return;
          }

          editor.focus();
          savedRangeRef.current = range.cloneRange();
          onChange(editor.innerHTML);
        }}
        onInput={(event) => {
          if (event.currentTarget.textContent.length > maxLength) {
            event.currentTarget.innerHTML = value || "";
            return;
          }
          onChange(event.currentTarget.innerHTML);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const editor = editorRef.current;
          if (!editor) return;
          const selection = window.getSelection();
          let range =
            selection?.rangeCount &&
            editor.contains(selection.getRangeAt(0).commonAncestorContainer)
              ? selection.getRangeAt(0)
              : null;
          if (!range) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
          }
          range.deleteContents();
          const lineBreak = document.createElement("br");
          range.insertNode(lineBreak);
          range.setStartAfter(lineBreak);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          savedRangeRef.current = range.cloneRange();
          onChange(editor.innerHTML);
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
      />
      <div className="admin-rich-editor__toolbar">
        <button
          type="button"
          className="btn btn--secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openLinkForm}
          aria-expanded={linkFormOpen}
        >
          {t("Create link")}
        </button>
      </div>
      {linkFormOpen && (
        <div className="admin-rich-editor__link-form">
          <label className="admin-field">
            <span>{t("Link text")}</span>
            <input
              type="text"
              value={linkText}
              onChange={(event) => setLinkText(event.target.value)}
              maxLength={500}
              autoFocus
            />
          </label>
          <label className="admin-field">
            <span>{t("Link URL")}</span>
            <input
              type="text"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              maxLength={2000}
              placeholder="https://…"
              autoComplete="url"
            />
          </label>
          {linkError && <p className="account-page__error" role="alert">{linkError}</p>}
          <div className="admin-rich-editor__link-actions">
            <button type="button" className="btn btn--primary" onClick={insertLink}>
              {t("Insert link")}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setLinkFormOpen(false);
                setLinkError("");
              }}
            >
              {t("Cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
