import { useLanguage } from "../../context/LanguageContext";
import { SkeletonRows } from "../ui/Skeleton";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { api, friendlyErrorMessage } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import {
  X,
  ArrowClockwise,
  Trash,
  Newspaper,
  FilmStrip,
  GameController,
  SquaresFour,
  CheckCircle,
  WarningCircle,
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

function contentKey(item) {
  const key = item?.id ?? item?.slug ?? item?.title;
  return key == null ? null : String(key);
}

async function loadPaginatedContent(path) {
  const limit = 48;
  const firstPage = await api.get(path, { page: 1, limit });
  const firstItems = normalizeList(firstPage);
  const pagination = firstPage?.pagination ?? firstPage?.meta?.pagination;
  const totalPagesValue =
    pagination?.totalPages ??
    pagination?.total_pages ??
    pagination?.pages ??
    firstPage?.totalPages;
  const totalPages = Number(totalPagesValue);
  const hasPageCount = Number.isFinite(totalPages) && totalPages > 0;
  const collected = [];
  const seen = new Set();

  const appendUnique = (list) => {
    list.forEach((item, index) => {
      const key = contentKey(item) ?? "page-item-" + collected.length + "-" + index;
      if (seen.has(key)) return;
      seen.add(key);
      collected.push(item);
    });
  };

  appendUnique(firstItems);
  if (hasPageCount && totalPages <= 1) return collected;
  if (!hasPageCount && firstItems.length < limit) return collected;

  let previousSignature = firstItems.map((item) => contentKey(item) ?? item?.title ?? "").join("|");
  const lastPage = hasPageCount ? Math.min(totalPages, 100) : 100;

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await api.get(path, { page, limit });
    const pageItems = normalizeList(response);
    if (!pageItems.length) break;

    const signature = pageItems.map((item) => contentKey(item) ?? item?.title ?? "").join("|");
    if (!hasPageCount && signature && signature === previousSignature) break;

    appendUnique(pageItems);
    previousSignature = signature;

    if (!hasPageCount && pageItems.length < limit) break;
  }

  return collected;
}

export function AdminComposer() {
  const { t } = useLanguage();
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(null);
  const [openingEdit, setOpeningEdit] = useState(null);
  const [type, setType] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [contentQuery, setContentQuery] = useState("");
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [items, setItems] = useState({
    news: [],
    videos: [],
    games: [],
  });
  const [loadingItems, setLoadingItems] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const set = (key) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function loadGameOptions() {
    const games = await loadPaginatedContent("/games");
    setItems((current) => ({ ...current, games }));
  }

  function open(typeName) {
    setActiveSection(
      typeName === "newsletter" ? "news" : typeName === "video" ? "videos" : "games",
    );
    setContentQuery("");
    setType(typeName);
    setEditing(null);
    setForm({ ...initial });
    setError("");
    setSaved(false);
    setConfirmingDelete(null);
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

      setActiveSection(kind);
      setContentQuery("");
      setForm(nextForm);
      setEditing({ kind, id: item.id });
      setSaved(false);
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
      await openManage();
      if (!editing) setForm({ ...initial });
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

  const loadManageItems = useCallback(async () => {
    setLoadingItems(true);
    setError("");

    try {
      const [news, videos, games] = await Promise.all([
        loadPaginatedContent("/newswire"),
        loadPaginatedContent("/videos"),
        loadPaginatedContent("/games"),
      ]);

      setItems({ news, videos, games });
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
  }, [t]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    void loadManageItems();
  }, [loadManageItems, user?.role]);

  async function openManage() {
    await loadManageItems();
  }

  const deleteEndpointMap = {
    news: "newsletter",
    videos: "video",
    games: "game",
  };

  async function remove(kind, id) {
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
      setConfirmingDelete(null);
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
    { key: "news", label: t("Newswire"), icon: Newspaper, createType: "newsletter" },
    { key: "videos", label: t("Videos"), icon: FilmStrip, createType: "video" },
    { key: "games", label: t("Games"), icon: GameController, createType: "game" },
  ];
  const activeSectionData = sections.find((section) => section.key === activeSection);
  const ActiveSectionIcon = activeSectionData?.icon;
  const activeItems = items[activeSection] || [];
  const normalizedQuery = contentQuery.trim().toLocaleLowerCase();
  const filteredItems = activeItems.filter((item) =>
    [item.title, item.slug, item.category, item.status]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );

  function selectSection(sectionKey) {
    setActiveSection(sectionKey);
    setContentQuery("");
    setType(null);
    setEditing(null);
    setForm({ ...initial });
    setError("");
    setSaved(false);
    setConfirmingDelete(null);
  }

  function createForSection() {
    if (activeSectionData) open(activeSectionData.createType);
  }

  if (user?.role !== "admin") return null;

  return (
    <div className="account-page container">
      <header className="account-row--inline" style={{ alignItems: "flex-start", marginBottom: 32 }}>
        <div className="account-block__head" style={{ flex: 1, minWidth: 0 }}>
          <p className="news-detail__eyebrow">{t("Studio workspace")}</p>
          <h1 style={{ fontSize: "clamp(34px, 4.3vw, 52px)", marginBottom: 10 }}>
            {t("Admin panel")}
          </h1>
          <p>{t("Manage and publish games, videos, and news in one place.")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={openManage}
          loading={loadingItems}
          disabled={loadingItems}
        >
          <ArrowClockwise weight="bold" />
          {t("Refresh content")}
        </Button>
      </header>

      <div className="account-page__layout">
        <nav aria-label={t("Admin navigation")}>
          <div className="account-nav-title">{t("Workspace")}</div>
          <button
            type="button"
            className={activeSection === "overview" ? "account-nav-item is-active" : "account-nav-item"}
            onClick={() => selectSection("overview")}
            aria-current={activeSection === "overview" ? "page" : undefined}
          >
            <SquaresFour weight="bold" />
            {t("Overview")}
          </button>
          <div className="account-nav-title">{t("Published content")}</div>
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={activeSection === key ? "account-nav-item is-active" : "account-nav-item"}
              onClick={() => selectSection(key)}
              aria-current={activeSection === key ? "page" : undefined}
            >
              <Icon weight="bold" />
              {label}
            </button>
          ))}
        </nav>

        <div className="account-page__content">
          {type && (
            <section
              className="support-card support-contact-panel account-block"
              aria-labelledby="admin-composer-title"
            >
              <header className="account-row--inline" style={{ alignItems: "flex-start", marginBottom: 24 }}>
                <div className="account-block__head" style={{ flex: 1, minWidth: 0 }}>
                  <p className="news-detail__eyebrow">
                    {editing ? t("Editing published content") : t("New content")}
                  </p>
                  <h2 id="admin-composer-title" style={{ marginBottom: 8 }}>
                    {editing
                      ? t("Edit") + " " + (type === "newsletter" ? t("Newswire") : type === "video" ? t("Video") : t("Game"))
                      : type === "newsletter"
                        ? t("Publish news")
                        : type === "video"
                          ? t("Add video")
                          : t("Add game")}
                  </h2>
                  <p>
                    {type === "newsletter"
                      ? t("Set a headline, summary, image and related game for this news post.")
                      : type === "video"
                        ? t("Enter the source URL and duration.")
                        : t("Set the title, slug, release details and core description.")}
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={closeComposer} disabled={saving}>
                  <X weight="bold" />
                  {t("Cancel")}
                </Button>
              </header>

              {error && (
                <p className="admin-modal__error" role="alert">
                  <WarningCircle weight="bold" />
                  <span>{t(error)}</span>
                </p>
              )}
              {saved && (
                <p className="admin-modal__saved" role="status" aria-live="polite">
                  <CheckCircle weight="bold" />
                  <span>{editing ? t("Changes saved.") : t("Published successfully.")}</span>
                </p>
              )}

              <form onSubmit={submit}>
                {type === "newsletter" && (
                  <>
                    <section className="account-block" role="group" aria-labelledby="admin-article-details">
                      <div className="account-block__head">
                        <h3 id="admin-article-details">{t("Article details")}</h3>
                        <p>{t("Set a headline, summary, image and related game for this news post.")}</p>
                      </div>
                      <div className="admin-modal__row">
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
                      </div>
                      <div className="admin-modal__row">
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
                        <Field
                          label={t("Image URL")}
                          value={form.image}
                          onChange={set("image")}
                          maxLength={2000}
                          placeholder="https://… /assets/…"
                        />
                      </div>
                    </section>
                    <section className="account-block" role="group" aria-labelledby="admin-article-body">
                      <div className="account-block__head">
                        <h3 id="admin-article-body">{t("Article body")}</h3>
                        <p>{t("Write the full story for this news post.")}</p>
                      </div>
                      <NewswireBodyEditor
                        label={t("Body")}
                        value={form.body}
                        onChange={(value) => setForm((current) => ({ ...current, body: value }))}
                        maxLength={30000}
                      />
                    </section>
                  </>
                )}

                {type === "video" && (
                  <>
                    <section className="account-block" role="group" aria-labelledby="admin-video-details">
                      <div className="account-block__head">
                        <h3 id="admin-video-details">{t("Video details")}</h3>
                        <p>{t("Enter the source URL and duration.")}</p>
                      </div>
                      <div className="admin-modal__row">
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
                      </div>
                      <div className="admin-modal__row">
                        <Field
                          label={t("Video URL")}
                          type="url"
                          maxLength={2000}
                          value={form.videoUrl}
                          onChange={set("videoUrl")}
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
                      </div>
                    </section>
                    <section className="account-block" role="group" aria-labelledby="admin-video-thumbnails">
                      <div className="account-block__head">
                        <h3 id="admin-video-thumbnails">{t("Thumbnails by language")}</h3>
                        <p>{t("Add a default thumbnail and optional language-specific versions.")}</p>
                      </div>
                      <Field
                        label={t("Thumbnail URL")}
                        maxLength={2000}
                        value={form.thumbnail}
                        onChange={set("thumbnail")}
                      />
                      <div className="admin-modal__row">
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
                      </div>
                      <Field
                        label={t("Thumbnail URL (Spanish)")}
                        maxLength={2000}
                        value={form.thumbnailEs}
                        onChange={set("thumbnailEs")}
                        placeholder="https://…"
                      />
                    </section>
                  </>
                )}

                {type === "game" && (
                  <>
                    <section className="account-block" role="group" aria-labelledby="admin-game-details">
                      <div className="account-block__head">
                        <h3 id="admin-game-details">{t("Game details")}</h3>
                        <p>{t("Set the title, slug, release details and core description.")}</p>
                      </div>
                      <div className="admin-modal__row">
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
                      </div>
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
                    </section>

                    <section className="account-block" role="group" aria-labelledby="admin-game-artwork">
                      <div className="account-block__head">
                        <h3 id="admin-game-artwork">{t("Artwork and trailer")}</h3>
                        <p>{t("Add the artwork and trailer used on the game page.")}</p>
                      </div>
                      <div className="admin-modal__row">
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
                      </div>
                      <Field
                        label={t("Trailer URL")}
                        type="url"
                        maxLength={2000}
                        value={form.trailerUrl}
                        onChange={set("trailerUrl")}
                      />
                    </section>

                    <section className="account-block" role="group" aria-labelledby="admin-game-store">
                      <div className="account-block__head">
                        <h3 id="admin-game-store">{t("Store and access")}</h3>
                        <p>{t("Add purchase, download and store information when available.")}</p>
                      </div>
                      <div className="admin-modal__row">
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
                      </div>
                      <Text
                        label={t("Microsoft Store badge HTML (optional)")}
                        value={form.microsoftStoreBadge}
                        onChange={set("microsoftStoreBadge")}
                        maxLength={4000}
                      />
                      <div className="admin-modal__row">
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
                      </div>
                      <Field
                        label={t("Download URL")}
                        type="url"
                        maxLength={2000}
                        value={form.downloadUrl}
                        onChange={set("downloadUrl")}
                        placeholder="https://..."
                      />
                    </section>

                    <section className="account-block" role="group" aria-labelledby="admin-game-discovery">
                      <div className="account-block__head">
                        <h3 id="admin-game-discovery">{t("Discoverability")}</h3>
                        <p>{t("Choose genres and platforms so players can find your game.")}</p>
                      </div>
                      <div className="admin-modal__row">
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
                      </div>
                      <label className="admin-check">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={set("featured")}
                        />
                        <span>{t("Feature on homepage")}</span>
                      </label>
                    </section>
                  </>
                )}

                <div className="account-block__foot">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <><LoadingSpinner />{t("Saving…")}</>
                    ) : editing ? (
                      t("Save changes")
                    ) : (
                      t("Save & publish")
                    )}
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeComposer} disabled={saving}>
                    {t("Cancel")}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {!type && activeSection === "overview" && (
            <>
              <section className="support-card support-faq-panel account-block">
                <div className="account-block__head">
                  <h2>{t("Content overview")}</h2>
                  <p>{t("Choose a section to manage content.")}</p>
                </div>
                {loadingItems ? (
                  <SkeletonRows count={3} />
                ) : (
                  <div className="studio-game-strip" style={{ margin: "0 0 28px", padding: 24, gap: 20 }}>
                    <div>
                      <p style={{ marginBottom: 6 }}>{t("Games")}</p>
                      <h3 style={{ marginBottom: 0, fontSize: 32 }}>{items.games.length}</h3>
                    </div>
                    <div>
                      <p style={{ marginBottom: 6 }}>{t("Videos")}</p>
                      <h3 style={{ marginBottom: 0, fontSize: 32 }}>{items.videos.length}</h3>
                    </div>
                    <div>
                      <p style={{ marginBottom: 6 }}>{t("Newswire")}</p>
                      <h3 style={{ marginBottom: 0, fontSize: 32 }}>{items.news.length}</h3>
                    </div>
                  </div>
                )}

                <div className="account-block__head">
                  <h3>{t("Create content")}</h3>
                  <p>{t("Create or update studio content directly in this workspace.")}</p>
                </div>
                <div className="studio-actions" style={{ marginTop: 0 }}>
                  <Button type="button" variant="primary" onClick={() => open("game")} disabled={saving}>
                    <GameController weight="bold" />
                    {t("Add game")}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => open("video")} disabled={saving}>
                    <FilmStrip weight="bold" />
                    {t("Add video")}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => open("newsletter")} disabled={saving}>
                    <Newspaper weight="bold" />
                    {t("Publish news")}
                  </Button>
                </div>
              </section>

              <section className="support-card support-contact-panel">
                <div className="account-block__head">
                  <h2>{t("Published content")}</h2>
                  <p>{t("Choose a section to manage content.")}</p>
                </div>
                <div className="support-quick-grid">
                  {sections.map(({ key, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={key}
                      className="btn btn--secondary"
                      onClick={() => selectSection(key)}
                      style={{ justifyContent: "flex-start", textAlign: "left", whiteSpace: "normal", minHeight: 78, padding: 20, gap: 14 }}
                    >
                      <Icon weight="bold" />
                      <div style={{ minWidth: 0 }}>
                        <strong>{label}</strong>
                        <span>{items[key].length} {t("Published content").toLocaleLowerCase()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeSection !== "overview" && (
            <section className="support-card support-faq-panel account-block" aria-labelledby="admin-manage-title">
              <header className="account-row--inline" style={{ alignItems: "flex-start", marginBottom: 20 }}>
                <div className="account-block__head" style={{ flex: 1, minWidth: 0 }}>
                  <h2 id="admin-manage-title">{t("Published content")}</h2>
                  <p>{activeSectionData?.label || t("Manage and publish games, videos, and news in one place.")}</p>
                </div>
                {!type && (
                  <Button type="button" variant="primary" onClick={createForSection} disabled={saving}>
                    {ActiveSectionIcon && <ActiveSectionIcon weight="bold" />}
                    {activeSection === "news" ? t("Publish news") : activeSection === "videos" ? t("Add video") : t("Add game")}
                  </Button>
                )}
              </header>

              <label className="admin-field">
                <span>{t("Search published content")}</span>
                <input
                  type="search"
                  value={contentQuery}
                  onChange={(event) => setContentQuery(event.target.value)}
                  autoComplete="off"
                />
              </label>

              {error && !type && (
                <p className="admin-modal__error" role="alert">
                  <WarningCircle weight="bold" />
                  <span>{t(error)}</span>
                </p>
              )}

              {loadingItems ? (
                <SkeletonRows count={4} />
              ) : filteredItems.length === 0 ? (
                <p className="admin-manage__empty">
                  {normalizedQuery ? t("No items match your search.") : t("No items published.")}
                </p>
              ) : (
                <div className="admin-manage">
                  <section className="admin-manage__section">
                    {filteredItems.map((item) => {
                      const deleteKey = activeSection + ":" + item.id;
                      return (
                        <article className="admin-manage__item" key={deleteKey}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{item.title}</strong>
                            {(item.slug || item.category || item.status) && (
                              <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)", fontSize: 13 }}>
                                {item.slug || item.category || t(item.status)}
                              </p>
                            )}
                          </div>
                          {confirmingDelete === deleteKey ? (
                            <div className="studio-actions" style={{ marginTop: 0, flex: "1 1 100%" }}>
                              <span role="alert">{t("Delete this item permanently? This action cannot be undone.")}</span>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={() => remove(activeSection, item.id)}
                                disabled={deleting === deleteKey}
                                loading={deleting === deleteKey}
                              >
                                {t("Delete")}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setConfirmingDelete(null)}
                                disabled={deleting === deleteKey}
                              >
                                {t("Cancel")}
                              </Button>
                            </div>
                          ) : (
                            <div className="admin-manage__item-actions">
                              <button
                                type="button"
                                onClick={() => edit(activeSection, item)}
                                disabled={Boolean(openingEdit) || deleting === deleteKey}
                                className="btn btn--secondary"
                                aria-busy={openingEdit === deleteKey}
                                aria-label={t("Edit {0}", { 0: item.title })}
                              >
                                {openingEdit === deleteKey ? <LoadingSpinner /> : <PencilSimple weight="bold" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingDelete(deleteKey)}
                                disabled={deleting === deleteKey}
                                aria-busy={deleting === deleteKey}
                                className="btn btn--danger"
                                aria-label={t("Delete {0}", { 0: item.title })}
                              >
                                <Trash weight="bold" />
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </section>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
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
          const lines = pastedText.replace(/\r\n?/g, "\n").split("\n");
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
