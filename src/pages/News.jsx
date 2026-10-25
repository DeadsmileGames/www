import { sanitizeNewswire } from "../utils/contentHtml";
import { SkeletonNews } from "../components/ui/Skeleton";
import { useEffect, useRef } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { useState } from "react";
import { ErrorState } from "../components/ui/ErrorState";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { useAuth } from "../hooks/useAuth";
import { Reveal } from "../components/ui/Reveal";
import { ArrowUpRight, Trash } from "@phosphor-icons/react";
import { api, friendlyErrorMessage } from "../services/api";
import { safeImageUrl } from "../utils/urls";
import { getExternalPageTitle } from "../utils/linkTitles";
import { AutoLinkText } from "../components/ui/AutoLinkText";

function NewswireBody({ body }) {
  const { language } = useLanguage();
  const bodyRef = useRef(null);
  const html = sanitizeNewswire(body, language);

  useEffect(() => {
    let active = true;
    const links = bodyRef.current?.querySelectorAll('a[data-auto-title="true"]') || [];
    for (const link of links) {
      const currentText = link.textContent;
      getExternalPageTitle(link.href).then((title) => {
        if (active && title && link.isConnected && link.textContent === currentText) {
          link.textContent = title;
        }
      });
    }
    return () => {
      active = false;
    };
  }, [html]);

  return (
    <div
      ref={bodyRef}
      style={{ whiteSpace: "pre-line" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function News() {
  const { t, language } = useLanguage();
  const { slug } = useParams();
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const list = useContent(slug ? null : "/newswire", { limit: 24 });
  const detail = useContent(slug ? `/newswire/${encodeURIComponent(slug)}` : null, {});
  const isAdmin = user?.role === "admin";
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const update = (event) => {
      const change = event.detail;
      if (
        !slug ||
        !detail.data?.id ||
        (change?.event_type !== "news.updated" && change?.event_type !== "news.deleted")
      )
        return;
      if ((change.payload?.id || change.entity_id) !== detail.data.id) return;
      if (change.event_type === "news.deleted") navigate("/newswire", { replace: true });
      else if (change.payload?.slug && change.payload.slug !== slug)
        navigate(`/newswire/${encodeURIComponent(change.payload.slug)}`, {
          replace: true,
        });
    };
    window.addEventListener("deadsmile:live", update);
    return () => window.removeEventListener("deadsmile:live", update);
  }, [slug, detail.data?.id, navigate]);

  async function remove(id, fromDetail = false) {
    if (deleting) return;
    if (!window.confirm(t("Delete this story permanently?"))) return;
    setDeleting(id);
    setDeleteError("");
    try {
      try {
        await api.delete(`/admin/newsletter/${encodeURIComponent(id)}`);
      } catch (err) {
        if (err?.status === 401) {
          await refresh();
          await api.delete(`/admin/newsletter/${encodeURIComponent(id)}`);
        } else throw err;
      }
      if (fromDetail) navigate("/newswire", { replace: true });
      else list.retry();
    } catch (err) {
      setDeleteError(friendlyErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  if (slug) {
    if (detail.status === "idle" || detail.status === "loading")
      return (
        <div className="news-detail container">
          <SkeletonNews detail />
        </div>
      );

    if (detail.status === "error")
      return (
        <div className="news-detail container">
          
          <ErrorState message={detail.error} onRetry={detail.retry} />
        </div>
      );

    const item = detail.data;
    return (
      <article className="news-detail container">
        
        <Reveal>
          <header className="news-detail__header">
            <div className="news-detail__eyebrow">
              <time>
                {new Date(item.published_at).toLocaleDateString(
                  language,

                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  },
                )}
              </time>
            </div>
            <h1>{item.title}</h1>
            {item.excerpt && <p className="news-detail__lead"><AutoLinkText>{item.excerpt}</AutoLinkText></p>}
          </header>
          {item.image && (
            <figure className="news-detail__image">
              <img src={safeImageUrl(item.image)} alt="" />
            </figure>
          )}
          <div className="news-detail__content">
            <div className="news-detail__body news-article-body">
              <div lang="en">
                <NewswireBody body={item.body} />
              </div>
            </div>
          </div>
          {item.game_id && item.game_slug && (
            <section className="game-details__related" style={{ marginTop: 32 }}>
              <h2>{t("games.related")}</h2>
              <Link
                className="news-featured"
                to={`/games/${encodeURIComponent(item.game_slug)}`}
              >
                {safeImageUrl(item.game_cover_image) && (
                  <div className="news-featured__visual">
                    <img
                      src={safeImageUrl(item.game_cover_image)}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="news-featured__meta">
                  <h3>{item.game_title}</h3>
                  <span className="btn btn--primary">
                    {t("View game")}
                    <ArrowUpRight weight="bold" />
                  </span>
                </div>
              </Link>
            </section>
          )}
          {deleteError && (
            <p className="account-page__error" role="alert">
              {deleteError}
            </p>
          )}
          {isAdmin && (
            <button
              className="btn btn--danger"
              type="button"
              onClick={() => remove(item.id, true)}
              disabled={Boolean(deleting)}
              aria-busy={deleting === item.id}
            >
              <Trash weight="bold" />
              {t(" Delete story")}
            </button>
          )}
        </Reveal>
      </article>
    );
  }

  const newsItems =
    list.status === "success" && Array.isArray(list.data) ? list.data : [];

  return (
    <div className="news-page container">
      

      <Reveal>
        <div className="news-page__heading">
          <div>
            <h1>{t("news.title")}</h1>
          </div>

          <p className="news-page__intro">{t("news.intro")}</p>
        </div>
      </Reveal>

      <div
        className="news-page__list"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {list.status === "loading" && <SkeletonNews />}

        {list.status === "error" && (
          <ErrorState message={list.error} onRetry={list.retry} />
        )}

        {deleteError && (
          <p className="account-page__error" role="alert">
            {deleteError}
          </p>
        )}
        {list.status === "success" && newsItems.length === 0 && (
          <EmptyState title={t("news.empty")} />
        )}
        {newsItems.map((story, i) => (
          <Reveal key={story.id} className="news-card">
            <article className="news-featured">
              <Link
                to={`/newswire/${encodeURIComponent(story.slug)}`}
                className="news-featured__visual"
                aria-label={story.title}
              >
                {story.image && (
                  <img
                    src={safeImageUrl(story.image)}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                )}
              </Link>

              <div className="news-featured__meta">
                <div className="news-page__date">
                  <span>
                    {new Date(story.published_at).toLocaleDateString(
                      language,

                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      },
                    )}
                  </span>
                </div>

                <h2>
                  <Link to={`/newswire/${encodeURIComponent(story.slug)}`}>
                    {story.title}
                  </Link>
                </h2>

                {story.excerpt && <p><AutoLinkText>{story.excerpt}</AutoLinkText></p>}

                <div className="news-card__actions">
                  <Link
                    to={`/newswire/${encodeURIComponent(story.slug)}`}
                    className="btn btn--primary"
                  >
                    {t("common.readMore")}
                    <ArrowUpRight weight="bold" />
                  </Link>
                  {isAdmin && (
                    <button
                      className="btn btn--danger"
                      type="button"
                      onClick={() => remove(story.id)}
                      disabled={Boolean(deleting)}
                      aria-busy={deleting === story.id}
                      aria-label={t("Delete {0}", { 0: story.title })}
                      style={{
                        marginTop: "12px",
                      }}
                    >
                      <Trash weight="bold" />
                      {t("Delete story")}
                    </button>
                  )}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
