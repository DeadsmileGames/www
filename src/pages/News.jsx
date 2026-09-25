import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { useAuth } from "../hooks/useAuth";
import { Reveal } from "../components/ui/Reveal";
import { ArrowLeft, ArrowUpRight, Trash } from "@phosphor-icons/react";
import { api } from "../services/api";
import { safeImageUrl } from "../utils/urls";

function NewswireBody({ body }) {
    const text = String(body || "");

    const badgePattern =
        /<a\b[^>]*href=["']https:\/\/get\.microsoft\.com\/installer\/download\/([a-z0-9]{12})\?referrer=appbadge["'][^>]*>\s*<img\b[^>]*src=["']https:\/\/get\.microsoft\.com\/images\/en-us(?:%20| )light\.svg["'][^>]*\/?>\s*<\/a>/gi;

    const nodes = [];
    let offset = 0;

    function addText(value) {
        value
            .split(/\n\s*\n|\n/)
            .filter(Boolean)
            .forEach((paragraph) => {
                nodes.push(
                    <p key={nodes.length}>{paragraph}</p>
                );
            });
    }

    for (const match of text.matchAll(badgePattern)) {
        addText(text.slice(offset, match.index));

        const productId = match[1].toUpperCase();

        nodes.push(
            <a
                key={nodes.length}
                href={`https://get.microsoft.com/installer/download/${productId}?referrer=appbadge`}
                target="_self"
                aria-label="Get it from Microsoft Store"
            >
                <img
                    src="https://get.microsoft.com/images/en-us%20light.svg"
                    width="200"
                    alt="Get it from Microsoft Store"
                    loading="lazy"
                />
            </a>
        );

        offset = match.index + match[0].length;
    }

    addText(text.slice(offset));

    return <>{nodes}</>;
}

export function News() {
    const { t } = useLanguage();
    const { slug } = useParams();
    const { user, refresh } = useAuth();
    const navigate = useNavigate();
    const list = useContent("/news", { limit: 24 });
    const detail = useContent(slug ? `/news/${encodeURIComponent(slug)}` : null, {});
    const isAdmin = user?.role === "admin";

    async function remove(id, fromDetail = false) {
        if (!window.confirm("Delete this story permanently?")) return;
        try {
            try {
                await api.delete(`/admin/newsletter/${encodeURIComponent(id)}`);
            } catch (err) {
                if (err?.status === 401) {
                    await refresh();
                    await api.delete(`/admin/newsletter/${encodeURIComponent(id)}`);
                } else throw err;
            }
            if (fromDetail) navigate("/news", { replace: true });
            else list.retry();
        } catch (err) {
            window.alert(err.message || "Unable to delete story.");
        }
    }

    if (slug) {
        if (detail.status === "idle" || detail.status === "loading" || !detail.data)
            return (
                <div className="news-detail container">
                    <p>Loading…</p>
                </div>
            );
        if (detail.status === "error")
            return (
                <div className="news-detail container">
                    <Link to="/news" className="back-link">
                        <ArrowLeft weight="bold" /> <span>Back</span>
                    </Link>
                    <h1>Story not found.</h1>
                </div>
            );
        const item = detail.data;
        return (
            <article className="news-detail container">
                <Link to="/news" className="back-link">
                    <ArrowLeft weight="bold" /> <span>Back</span>
                </Link>
                <Reveal>
                    <header className="news-detail__header">
                        <div className="news-detail__eyebrow">
                            <time>
                                {new Date(
                                    item.published_at,
                                ).toLocaleDateString(
                                    'en-US',
                                    {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        timeZone: 'UTC',
                                    }
                                )}
                            </time>
                        </div>
                        <h1>{item.title}</h1>
                        {item.excerpt && (
                            <p className="news-detail__lead">{item.excerpt}</p>
                        )}
                    </header>
                    {item.image && (
                        <figure className="news-detail__image">
                            <img src={safeImageUrl(item.image)} alt="" />
                        </figure>
                    )}
                    <div className="news-detail__content">
                       <div className="news-detail__body">
                            <NewswireBody body={item.body} />
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            className="btn btn--danger"
                            type="button"
                            onClick={() => remove(item.id, true)}
                        >
                            <Trash weight="bold" /> Delete story
                        </button>
                    )}
                </Reveal>
            </article>
        );
    }

    
    const newsItems =
        list.status === "success" && Array.isArray(list.data)
            ? list.data
            : [];

    return (
        <div className="news-page container">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>

            <Reveal>
                <div className="news-page__heading">
                    <div>
                        <h1>{t("news.title")}</h1>
                    </div>

                    <p className="news-page__intro">
                        {t("news.intro")}
                    </p>
                </div>
            </Reveal>

            <div
                className="news-page__list"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px"
                }}
            >
                {list.status === "loading" && (
                    <p>Loading…</p>
                )}

                {list.status === "error" && (
                    <p>{list.error}</p>
                )}

                {newsItems.map((story, i) => (
                    <Reveal
                        key={story.id}
                        delay={Math.min(i * 50, 250)}
                        className="news-card"
                    >
                        <Link
                            to={`/news/${story.slug}`}
                            className="news-featured"
                        >
                            <div className="news-featured__visual">
                                {story.image && (
                                    <img
                                        src={safeImageUrl(story.image)}
                                        alt=""
                                        loading={i === 0 ? "eager" : "lazy"}
                                    />
                                )}
                            </div>

                            <div className="news-featured__meta">
                                <div className="news-page__date">
                                    <span>
                                        {new Date(
                                            story.published_at
                                        ).toLocaleDateString(
                                            "en-US",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                timeZone: "UTC"
                                            }
                                        )}
                                    </span>
                                </div>

                                <h2>{story.title}</h2>

                                {story.excerpt && (
                                    <p>{story.excerpt}</p>
                                )}

                                <div className="news-card__actions">
                                    <span className="btn btn--primary">
                                        {t("common.readMore")}
                                        <ArrowUpRight weight="bold" />
                                    </span>
                                    {isAdmin && (
                                        <button
                                            className="btn btn--danger"
                                            type="button"
                                            onClick={() => remove(story.id)}
                                            aria-label={`Delete ${story.title}`}
                                            style={{
                                                marginTop: "12px"
                                            }}
                                        >
                                            <Trash weight="bold" />
                                            Delete story
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </Reveal>
                ))}
            </div>
        </div>
    );
}
